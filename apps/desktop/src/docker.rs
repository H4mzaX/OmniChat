use bollard::container::{
    Config, CreateContainerOptions, LogOutput, LogsOptions, RemoveContainerOptions,
    WaitContainerOptions,
};
use bollard::image::CreateImageOptions;
use bollard::Docker;
use futures_util::StreamExt;
use serde_json::json;
use std::collections::HashMap;
use std::time::Duration;
use tokio::time::timeout;

pub async fn check_docker() -> Result<serde_json::Value, String> {
    let docker =
        Docker::connect_with_local_defaults().map_err(|e| format!("Docker connection failed: {e}"))?;

    let version = docker.version().await.map_err(|e| format!("Docker version check failed: {e}"))?;

    Ok(json!({
        "available": true,
        "version": version.version.unwrap_or_default(),
        "api_version": version.api_version.unwrap_or_default(),
        "os": version.os.unwrap_or_default(),
        "arch": version.arch.unwrap_or_default(),
    }))
}

pub async fn run_sandbox(
    image: &str,
    code: &str,
    language: &str,
    timeout_secs: u64,
) -> Result<serde_json::Value, String> {
    let docker =
        Docker::connect_with_local_defaults().map_err(|e| format!("Docker connection failed: {e}"))?;

    let cmd = build_command(language, code);

    let tmpfs_map = HashMap::from_iter(vec![("/tmp".into(), "noexec,nosuid,size=64M".into())]);

    let config = Config {
        image: Some(image.to_string()),
        cmd: Some(cmd),
        network_disabled: Some(true),
            stop_timeout: Some(timeout_secs as i64),
        host_config: Some(bollard::service::HostConfig {
            memory: Some(256 * 1024 * 1024),
            memory_swap: Some(0),
            cpu_shares: Some(512),
            pids_limit: Some(50),
            security_opt: Some(vec!["no-new-privileges:true".into()]),
            cap_drop: Some(vec!["ALL".into()]),
            readonly_rootfs: Some(true),
            tmpfs: Some(tmpfs_map),
            ..Default::default()
        }),
        ..Default::default()
    };

    let container_name = format!("omniclaude-sandbox-{}", uuid::Uuid::new_v4());
    let create_options = CreateContainerOptions {
        name: &container_name,
        platform: None,
    };

    let container = docker
        .create_container(Some(create_options), config)
        .await
        .map_err(|e| format!("Container creation failed: {e}"))?;

    docker
        .start_container::<String>(&container.id, None)
        .await
        .map_err(|e| format!("Container start failed: {e}"))?;

    // Wait for container to exit with timeout
    let mut wait_stream = docker.wait_container::<&str>(
        &container.id,
        Some(WaitContainerOptions {
            condition: "not-running",
        }),
    );

    let timed_out = match timeout(Duration::from_secs(timeout_secs + 5), wait_stream.next()).await {
        Ok(Some(Ok(_wait))) => false,
        Ok(Some(Err(e))) => {
            return Err(format!("Container wait error: {e}"));
        }
        Ok(None) => false,
        Err(_) => true,
    };

    // Get logs
    let logs = docker
        .logs::<String>(
            &container.id,
            Some(LogsOptions::<String> {
                stdout: true,
                stderr: true,
                ..Default::default()
            }),
        )
        .collect::<Vec<Result<LogOutput, _>>>()
        .await;

    let log_text: String = logs
        .into_iter()
        .filter_map(|r| r.ok())
        .map(|output| match output {
            LogOutput::StdOut { message } | LogOutput::StdErr { message } => {
                String::from_utf8_lossy(&message).to_string()
            }
            _ => String::new(),
        })
        .collect();

    // Cleanup
    let _ = docker
        .remove_container(
            &container.id,
            Some(RemoveContainerOptions {
                force: true,
                ..Default::default()
            }),
        )
        .await;

    Ok(json!({
        "exit_code": if timed_out { -1 } else { 0 },
        "stdout": log_text,
        "stderr": "",
        "timed_out": timed_out,
        "language": language,
        "sandboxed": true,
    }))
}

pub async fn list_sandbox_images() -> Result<Vec<serde_json::Value>, String> {
    let docker =
        Docker::connect_with_local_defaults().map_err(|e| format!("Docker connection failed: {e}"))?;

    let images = docker
        .list_images::<String>(None)
        .await
        .map_err(|e| format!("Failed to list images: {e}"))?;

    let sandbox_images: Vec<serde_json::Value> = images
        .into_iter()
        .filter_map(|img| {
            let tags = img.repo_tags;
            let sandbox_tag = tags.iter().find(|t| {
                let t = t.to_lowercase();
                t.contains("python")
                    || t.contains("node")
                    || t.contains("alpine")
                    || t.contains("ubuntu")
            });
            sandbox_tag.map(|tag| {
                json!({
                    "tag": tag,
                    "id": img.id,
                    "created": img.created,
                    "size": img.size,
                })
            })
        })
        .collect();

    Ok(sandbox_images)
}

pub async fn pull_image(image: &str) -> Result<String, String> {
    let docker =
        Docker::connect_with_local_defaults().map_err(|e| format!("Docker connection failed: {e}"))?;

    let options = CreateImageOptions {
        from_image: image,
        ..Default::default()
    };

    let mut stream = docker.create_image(Some(options), None, None);
    let mut last_status = String::new();

    while let Some(result) = stream.next().await {
        match result {
            Ok(info) => {
                if let Some(status) = info.status {
                    last_status = status;
                }
            }
            Err(e) => return Err(format!("Pull failed: {e}")),
        }
    }

    Ok(format!("Image '{image}' pulled successfully: {last_status}"))
}

fn build_command(language: &str, code: &str) -> Vec<String> {
    match language.to_lowercase().as_str() {
        "python" | "py" => vec!["python3".into(), "-c".into(), code.to_string()],
        "javascript" | "js" => vec!["node".into(), "-e".into(), code.to_string()],
        "typescript" | "ts" => vec!["npx".into(), "tsx".into(), "-e".into(), code.to_string()],
        "bash" | "sh" => vec!["sh".into(), "-c".into(), code.to_string()],
        "ruby" | "rb" => vec!["ruby".into(), "-e".into(), code.to_string()],
        "rust" | "rs" => vec![
            "sh".into(),
            "-c".into(),
            format!("cat > /tmp/main.rs << 'EOF'\n{code}\nEOF\nrustc /tmp/main.rs -o /tmp/main && /tmp/main"),
        ],
        "go" => vec![
            "sh".into(),
            "-c".into(),
            format!("cat > /tmp/main.go << 'EOF'\n{code}\nEOF\ngo run /tmp/main.go"),
        ],
        "c" => vec![
            "sh".into(),
            "-c".into(),
            format!("cat > /tmp/main.c << 'EOF'\n{code}\nEOF\ngcc -o /tmp/main /tmp/main.c && /tmp/main"),
        ],
        "cpp" | "c++" => vec![
            "sh".into(),
            "-c".into(),
            format!("cat > /tmp/main.cpp << 'EOF'\n{code}\nEOF\ng++ -o /tmp/main /tmp/main.cpp && /tmp/main"),
        ],
        _ => vec!["sh".into(), "-c".into(), code.to_string()],
    }
}
