import PHP from "./index";

export function getTranslations() {
  const script = `$filesystem = (new Illuminate\\Filesystem\\Filesystem);if (! $filesystem->exists(resource_path('lang/en'))) {return;}$files = $filesystem->files(resource_path('lang/en'));$translations = [];foreach ($files as $file) {$fileName = str_replace('.php', '', $file->getFileName());$fields = include($file->getPathName());if (is_array($fields)) {foreach ($fields as $field => $message) {$translations[] = "{$fileName}.{$field}";}}}echo json_encode(array_filter($translations));`;

  return PHP.run(script);
}
