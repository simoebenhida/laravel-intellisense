import { path } from "./../utils";
import * as cp from "child_process";
import * as os from "os";
import { hasAutoload, hasBootstrapApp } from "./../laravel";
import { workspace } from "vscode";

export default class PHP {
  static phpParser: any = null;

  static running: boolean = false;

  static async run(code: string): Promise<string> {
    if (hasAutoload() && hasBootstrapApp()) {
      var script = this.getScript(code);

      var out: string | null | RegExpExecArray = await this.execute(script);

      out = /___OUTPUT___(.*)___END_OUTPUT___/g.exec(out);
      console.log(out)
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

    var command = this.getCommand() + '"' + code + '"';

    return new Promise<string>(async (resolve, error) => {
      cp.exec(command, {
        windowsHide: true
      }, (error, stdout, stderr) => {
        if (error) {
          console.error(`exec error: ${error}`);
          return;
        }
        console.log(`stdout: ${stdout}`);
        console.error(`stderr: ${stderr}`);
      });
    });
  }

  static getScript(code: string): string {
    return (
      "define('LARAVEL_START', microtime(true));" +
      "require_once '" +
      this.filePath("vendor/autoload.php") +
      "';" +
      "$app = require_once '" +
      this.filePath("bootstrap/app.php") +
      "';" +
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

  static getCommand() {
    if (this.isDocker()) {
      return this.getDockerscript() + " php -r";
    }

    return "php -r";
  }

  static filePath(file: string) {
    if (this.isDocker()) {
      return `./${file}`;
    }

    return path(file);
  }

  static isDocker(): boolean {
    return !!this.getDockerscript();
  }

  static getDockerscript(): string | undefined {
    return workspace.getConfiguration("LaravelIntellisense").get("docker");
  }
}
