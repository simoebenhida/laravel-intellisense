import PHP from "./index";

export function getRouterNames() {
  const script = `
        $routers = app('router')->getRoutes();

        $names = [];

        foreach ($routers as $router) {
            $names[] = $router->getName();
        }

        echo json_encode(array_filter($names));
    `;

  return PHP.run(script);
}
