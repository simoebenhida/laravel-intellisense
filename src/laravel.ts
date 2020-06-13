import * as fs from "fs";
import { path } from "./utils";

export const DOCUMENT_SELECTOR = [
  { scheme: "file", language: "php" },
  { scheme: "untitled", language: "php" },
  { scheme: "file", language: "blade" },
  { scheme: "file", language: "laravel-blade" },
];

export const TRIGGER_CHARACTERS = ['"', "'", ">"];

export function hasArtisan(): boolean {
  return fs.existsSync(path("artisan"));
}

export function hasAutoload(): boolean {
  return fs.existsSync(path("vendor/autoload.php"));
}

export function hasBootstrapApp(): boolean {
  return fs.existsSync(path("bootstrap/app.php"));
}
