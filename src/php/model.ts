import PHP from "./index";

export function getModelAttributes(model: string) {
  const script = `
        $user = ${model}::first();
        echo json_encode(array_keys($user->getAttributes()));
    `;

  return PHP.run(script);
}
