import PHP from "./index";

export function getRouterNames() {
  const script = `function getRoutes($routers){$routes = [];if (is_array($routers)) {foreach ($routers as $key => $router) {if (array_key_exists('as', $router['action'])) {$routes[] = $router['action']['as'];}}return $routes;}foreach ($routers as $router) {$routes[] = $router->getName();}return $routes;}$routers = app('router')->getRoutes();echo json_encode(array_filter(getRoutes($routers)));`;

  return PHP.run(script);
}
