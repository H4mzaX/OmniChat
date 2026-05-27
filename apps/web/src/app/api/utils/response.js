export function ok(data, status = 200) {
  return Response.json(data, { status });
}

export function created(data) {
  return Response.json(data, { status: 201 });
}

export function noContent() {
  return new Response(null, { status: 204 });
}

export function badRequest(message = "Bad request", details = null) {
  return Response.json({ error: message, details }, { status: 400 });
}

export function unauthorized(message = "Unauthorized") {
  return Response.json({ error: message }, { status: 401 });
}

export function notFound(message = "Not found") {
  return Response.json({ error: message }, { status: 404 });
}

export function tooMany(message = "Rate limit exceeded") {
  return Response.json({ error: message }, { status: 429 });
}

export function serverError(error) {
  console.error("Internal server error:", error);
  return Response.json(
    { error: error?.message || "Internal server error" },
    { status: 500 },
  );
}

export function methodNotAllowed(method) {
  return Response.json(
    { error: `Method ${method} not allowed` },
    { status: 405 },
  );
}

export function errorResponse(error) {
  if (error instanceof SyntaxError && error.message.includes("JSON")) {
    return badRequest("Invalid JSON body");
  }
  if (error?.status) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  return serverError(error);
}
