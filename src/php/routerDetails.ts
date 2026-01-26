import PHP from "./index";

export interface RouteInfo {
  name: string;
  uri: string;
  methods: string[];
  action: string;
  middleware: string[];
  file?: string;
  line?: number;
}

export async function getRouterDetails(): Promise<RouteInfo[]> {
  const script = `
    $router = app('router');
    $routes = $router->getRoutes();
    $result = [];

    foreach ($routes as $route) {
      $name = $route->getName();
      if (!$name) continue;

      $action = $route->getActionName();
      $file = null;
      $line = null;

      // Try to get file and line from controller
      if ($action && $action !== 'Closure' && strpos($action, '@') !== false) {
        list($controller, $method) = explode('@', $action);
        try {
          $reflection = new ReflectionMethod($controller, $method);
          $file = $reflection->getFileName();
          $line = $reflection->getStartLine();
        } catch (Exception $e) {}
      }

      // If it's a closure, try to find the route file
      if (!$file) {
        $action = $route->getAction();
        if (isset($action['uses']) && $action['uses'] instanceof Closure) {
          try {
            $reflection = new ReflectionFunction($action['uses']);
            $file = $reflection->getFileName();
            $line = $reflection->getStartLine();
          } catch (Exception $e) {}
        }
      }

      $result[] = [
        'name' => $name,
        'uri' => $route->uri(),
        'methods' => $route->methods(),
        'action' => is_string($route->getActionName()) ? $route->getActionName() : 'Closure',
        'middleware' => array_values($route->gatherMiddleware()),
        'file' => $file,
        'line' => $line,
      ];
    }

    echo json_encode($result);
  `;

  try {
    const result = await PHP.run(script);
    if (result) {
      return JSON.parse(result);
    }
  } catch {
    // Silently fail
  }

  return [];
}

export async function getRouteByName(name: string): Promise<RouteInfo | null> {
  const routes = await getRouterDetails();
  return routes.find((r) => r.name === name) || null;
}
