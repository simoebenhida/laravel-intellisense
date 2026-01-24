import PHP from "./index";

export function getModelAttributes(model: string): Promise<string> {
  const script = `
    $model = new ${model};
    $table = $model->getTable();
    $columns = \\Illuminate\\Support\\Facades\\Schema::getColumnListing($table);
    echo json_encode($columns);
  `;

  return PHP.run(script);
}
