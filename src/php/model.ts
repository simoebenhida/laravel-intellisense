import PHP from "./index";

export function getModelAttributes() {
  const script = `
        $user = App\\User::first();
        echo json_encode(array_keys($user->getAttributes()));
    `;

  return PHP.run(script);
}
