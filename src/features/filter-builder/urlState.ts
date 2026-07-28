import { fieldConfig } from "./fieldConfig";
import type { Field, FilterCondition, FilterGroup, FilterNode, Operator } from "./types";

const bytesToBase64 = (bytes: Uint8Array): string => {
  let binary = "";
  bytes.forEach((byte) => (binary += String.fromCharCode(byte)));
  return btoa(binary);
};

const base64ToBytes = (base64: string): Uint8Array => {
  const binary = atob(base64);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
};

export const encodeFilterToParam = (root: FilterGroup): string => {
  const bytes = new TextEncoder().encode(JSON.stringify(root));
  return bytesToBase64(bytes)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
};

const isField = (value: unknown): value is Field => typeof value === "string" && value in fieldConfig;

const parseCondition = (record: Record<string, unknown>): FilterCondition | null => {
  const { id, field, operator, value } = record;

  if (typeof id !== "string" || !isField(field)) {
    return null;
  }
  if (typeof operator !== "string" || !fieldConfig[field].operators.includes(operator as Operator)) {
    return null;
  }
  if (value !== undefined && typeof value !== "string" && typeof value !== "number") {
    return null;
  }

  return { id, kind: "condition", field, operator: operator as Operator, value };
};

const parseGroup = (record: Record<string, unknown>, depth: number): FilterGroup | null => {
  const { id, logic, children } = record;

  if (typeof id !== "string" || (logic !== "AND" && logic !== "OR") || !Array.isArray(children)) {
    return null;
  }

  const parsedChildren: FilterNode[] = [];

  for (const child of children) {
    const parsedChild = parseNode(child, depth + 1);
    if (parsedChild === null) {
      return null;
    }
    if (parsedChild.kind === "group" && depth !== 1) {
      return null;
    }
    parsedChildren.push(parsedChild);
  }

  return { id, kind: "group", logic, children: parsedChildren };
};

const parseNode = (value: unknown, depth: number): FilterNode | null => {
  if (typeof value !== "object" || value === null) {
    return null;
  }
  const record = value as Record<string, unknown>;
  if (record.kind === "condition") {
    return parseCondition(record);
  }
  if (record.kind === "group") {
    return parseGroup(record, depth);
  }
  return null;
};

export const decodeFilterFromParam = (raw: string | null): FilterGroup | null => {
  if (!raw) {
    return null;
  }

  try {
    const base64 = raw.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const json = new TextDecoder().decode(base64ToBytes(padded));
    const parsed: unknown = JSON.parse(json);
    const result = parseNode(parsed, 1);
    return result !== null && result.kind === "group" ? result : null;
  } catch {
    return null;
  }
};
