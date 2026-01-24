import { path } from "./../utils";
import * as cp from "child_process";
import * as os from "os";
import { hasAutoload, hasBootstrapApp } from "./../laravel";
import { workspace } from "vscode";

const EXECUTION_TIMEOUT = 30000; // 30 seconds timeout

export default class PHP {
  static async run(code: string): Promise<string> {
    if (!hasAutoload() || !hasBootstrapApp()) {
      return "";
    }

    try {
      const script = this.getScript(code);
      const output = await this.execute(script);
      const match = /___OUTPUT___(.*)___END_OUTPUT___/g.exec(output);

      return match ? match[1] : "";
    } catch {
      // Silently fail - don't spam logs when PHP execution fails
      // This can happen when the project is configured for Docker-only execution
      return "";
    }
  }

  static async execute(code: string): Promise<string> {
    const escapedCode = this.escapeForShell(code);
    const command = this.getCommand() + '"' + escapedCode + '"';
    const workingDir = this.getWorkingDirectory();

    return new Promise<string>((resolve) => {
      const options: cp.ExecOptions = {
        timeout: EXECUTION_TIMEOUT,
        maxBuffer: 1024 * 1024, // 1MB buffer
      };

      if (workingDir) {
        options.cwd = workingDir;
      }

      cp.exec(command, options, (err, stdout) => {
        // Always resolve, never reject - prevents unhandled rejection errors
        // and stops log spamming when PHP is not available or misconfigured
        const output = stdout?.toString() ?? "";
        if (err || output.length === 0) {
          resolve("");
          return;
        }
        resolve(output);
      });
    });
  }

  static escapeForShell(code: string): string {
    let escaped = code.replace(/"/g, '\\"');

    const isUnix = ["linux", "openbsd", "sunos", "darwin"].includes(
      os.platform()
    );

    if (isUnix) {
      escaped = escaped.replace(/\$/g, "\\$");
      escaped = escaped.replace(/\\\\'/g, "\\\\\\\\'");
      escaped = escaped.replace(/\\\\"/g, '\\\\\\\\"');
    }

    return escaped;
  }

  static getScript(code: string): string {
    const autoloadPath = this.filePath("vendor/autoload.php");
    const bootstrapPath = this.filePath("bootstrap/app.php");

    return `
      error_reporting(0);
      define('LARAVEL_START', microtime(true));
      require_once '${autoloadPath}';
      $app = require_once '${bootstrapPath}';
      $kernel = $app->make(Illuminate\\Contracts\\Console\\Kernel::class);
      $status = $kernel->handle(
        $input = new Symfony\\Component\\Console\\Input\\ArgvInput,
        new Symfony\\Component\\Console\\Output\\ConsoleOutput
      );
      echo '___OUTPUT___';
      ${code}
      echo '___END_OUTPUT___';
    `;
  }

  static getCommand(): string {
    const phpPath = this.getPhpPath();

    if (this.isDocker()) {
      return this.getDockerCommand() + ` ${phpPath} -r `;
    }

    return `${phpPath} -r `;
  }

  static filePath(file: string): string {
    if (this.isDocker()) {
      return `./${file}`;
    }

    return path(file);
  }

  static getWorkingDirectory(): string | undefined {
    const workspacePath = path("");
    return workspacePath ? workspacePath.replace(/\/$/, "") : undefined;
  }

  static isDocker(): boolean {
    return !!this.getDockerCommand();
  }

  static getDockerCommand(): string | undefined {
    return workspace.getConfiguration("LaravelIntellisense").get("docker");
  }

  static getPhpPath(): string {
    return (
      workspace.getConfiguration("LaravelIntellisense").get("phpPath") || "php"
    );
  }
}
