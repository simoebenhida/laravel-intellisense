import PHP from "./index";

export function getConfigElements() {
  const script = `
        $configs = app('config')->all();

        class ConfigTransformer {
            protected $items = [];

            public function __construct()
            {
                $this->items = collect();
            }

            public function transform($keys, $alias = '')
            {
                return collect($keys)->map(function ($keys, $index) use ($alias) {
                    if ($alias) {
                        $alias = $alias .'.';
                    }
                    if (! is_string($index)) {
                        return;
                    }

                    $alias .= $index;

                    if (is_array($keys)) {
                        return $this->transform($keys, $alias);
                    } else {
                        // var_dump($alias);
                        $this->items->push($alias);

                        return $keys;
                    }
                });
            }

            public function all(): array
            {
                return $this->items->filter(function ($config, $key) {
                    return strpos($config, 'app.providers') === false && strpos($config, 'filesystems.links') === false && strpos($config, 'app.aliases') === false;
                })->toArray();
            }
        }
        $config = new ConfigTransformer();

        $config->transform($configs);

        echo json_encode($config->all());
    `;

  return PHP.run(script);
}
