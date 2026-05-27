import sql from "@/app/api/utils/sql";

export async function GET() {
  try {
    const skills = await sql`SELECT * FROM skills ORDER BY name ASC`;
    return Response.json({ skills });
  } catch (err) {
    // Return fallback skills if table doesn't exist yet
    return Response.json({
      skills: [
        {
          id: 1,
          slug: "web-search",
          name: "Web Search",
          description: "Search the web for current information",
          icon: "🌐",
          is_enabled: true,
        },
        {
          id: 2,
          slug: "image-analysis",
          name: "Image Analysis",
          description: "Analyze and describe images",
          icon: "👁",
          is_enabled: true,
        },
        {
          id: 3,
          slug: "doc-reading",
          name: "Document Reading",
          description: "Read PDFs and documents",
          icon: "📄",
          is_enabled: true,
        },
        {
          id: 4,
          slug: "calculator",
          name: "Calculator",
          description: "Precise math calculations",
          icon: "🧮",
          is_enabled: true,
        },
        {
          id: 5,
          slug: "code-exec",
          name: "Code Execution",
          description: "Run code in a sandbox",
          icon: "⚡",
          is_enabled: false,
        },
        {
          id: 6,
          slug: "memory",
          name: "Memory",
          description: "Remember facts across chats",
          icon: "🧠",
          is_enabled: false,
        },
      ],
    });
  }
}

export async function PATCH(request) {
  try {
    const { slug, is_enabled } = await request.json();
    await sql`UPDATE skills SET is_enabled = ${is_enabled} WHERE slug = ${slug}`;
    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
