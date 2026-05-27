import { badRequest } from "./response";

export function validate(body, schema) {
  const errors = {};
  for (const [key, rules] of Object.entries(schema)) {
    const val = body[key];
    if (rules.required && (val === undefined || val === null || val === "")) {
      errors[key] = rules.message || `${key} is required`;
      continue;
    }
    if (val === undefined || val === null) continue;
    if (rules.type === "string" && typeof val !== "string") {
      errors[key] = `${key} must be a string`;
    }
    if (rules.type === "number" && typeof val !== "number") {
      errors[key] = `${key} must be a number`;
    }
    if (rules.type === "array" && !Array.isArray(val)) {
      errors[key] = `${key} must be an array`;
    }
    if (rules.type === "boolean" && typeof val !== "boolean") {
      errors[key] = `${key} must be a boolean`;
    }
    if (typeof val === "string" && rules.minLength && val.length < rules.minLength) {
      errors[key] = `${key} must be at least ${rules.minLength} characters`;
    }
    if (typeof val === "string" && rules.maxLength && val.length > rules.maxLength) {
      errors[key] = `${key} must be at most ${rules.maxLength} characters`;
    }
    if (rules.enum && !rules.enum.includes(val)) {
      errors[key] = `${key} must be one of: ${rules.enum.join(", ")}`;
    }
    if (rules.pattern && !rules.pattern.test(val)) {
      errors[key] = rules.patternMessage || `${key} has invalid format`;
    }
  }
  if (Object.keys(errors).length > 0) return errors;
  return null;
}

export function withValidation(schema) {
  return async (request, handler) => {
    try {
      const body = await request.json();
      const errors = validate(body, schema);
      if (errors) return badRequest("Validation failed", errors);
      return handler(body, request);
    } catch (e) {
      if (e instanceof SyntaxError) return badRequest("Invalid JSON");
      throw e;
    }
  };
}

export function validateQuery(searchParams, schema) {
  const errors = {};
  for (const [key, rules] of Object.entries(schema)) {
    const val = searchParams.get(key);
    if (rules.required && (val === null || val === "")) {
      errors[key] = rules.message || `${key} is required`;
      continue;
    }
    if (val === null) continue;
    if (rules.type === "number") {
      const n = Number(val);
      if (isNaN(n)) errors[key] = `${key} must be a number`;
    }
    if (rules.enum && !rules.enum.includes(val)) {
      errors[key] = `${key} must be one of: ${rules.enum.join(", ")}`;
    }
  }
  return Object.keys(errors).length > 0 ? errors : null;
}
