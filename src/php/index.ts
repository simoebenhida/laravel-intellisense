import { path } from "./../utils";
import * as cp from "child_process";
import * as os from "os";
import { hasAutoload, hasBootstrapApp } from "./../laravel";

export default class PHP {
  static phpParser: any = null;

  static running: boolean = false;

  static async run(code: string): Promise<string> {
    if (hasAutoload() && hasBootstrapApp()) {
      var script = this.getScript(code);

      var out: string | null | RegExpExecArray = await this.execute(script);

      out = /___OUTPUT___(.*)___END_OUTPUT___/g.exec(out);

      if (out) {
        return out[1];
      }
    }

    return "";
  }

  static async execute(code: string): Promise<string> {
    if (this.running) {
      return "";
    }

    this.running = true;

    code = code.replace(/\"/g, '\\"');

    if (
      ["linux", "openbsd", "sunos", "darwin"].some((unixPlatforms) =>
        os.platform().includes(unixPlatforms)
      )
    ) {
      code = code.replace(/\$/g, "\\$");
      code = code.replace(/\\\\'/g, "\\\\\\\\'");
      code = code.replace(/\\\\"/g, '\\\\\\\\"');
    }

    var command = 'php -r "' + code + '"';

    return new Promise<string>((resolve, error) => {
      cp.exec(command, (err, stdout, stderr) => {
        this.running = false;

        if (stdout.length > 0) {
          resolve(stdout);
        } else {
          console.error(err);
          error(stderr);
        }
      });
    });
  }

  static getScript(code: string): string {
    return (
      "define('LARAVEL_START', microtime(true));" +
      "require_once '" +
      path("vendor/autoload.php") +
      "';" +
      "$app = require_once '" +
      path("bootstrap/app.php") +
      "';" +
      "class ServiceProvider extends \\Illuminate\\Support\\ServiceProvider" +
      "{" +
      "	public function boot()" +
      "	{" +
      "		$this->app['log']->setHandlers([new \\Monolog\\Handler\\NullHandler()]);" +
      "	}" +
      "}" +
      "$app->register(new ServiceProvider($app));" +
      "$kernel = $app->make(Illuminate\\Contracts\\Console\\Kernel::class);" +
      "$status = $kernel->handle(" +
      "$input = new Symfony\\Component\\Console\\Input\\ArgvInput," +
      "new Symfony\\Component\\Console\\Output\\ConsoleOutput" +
      ");" +
      "echo '___OUTPUT___';" +
      code +
      "echo '___END_OUTPUT___';"
    );
  }
}
