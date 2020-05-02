import PHP from "./index";

export function getViews(): Promise<string> {
    const script = `
        function getViewsFromDirectory($directories, $filesystem, $parentDirectory = null)
        {
            $views = [];

            foreach ($directories as $directory) {
                $viewDirectory = basename($directory);

                if ($parentDirectory) {
                    $viewDirectory = $parentDirectory . '.' . $viewDirectory;
                }

                if ($filesystem->directories($directory)) {
                    $childDirectoryViews = getViewsFromDirectory($filesystem->directories($directory), $filesystem, $viewDirectory);

                    if ($childDirectoryViews) {
                        $views[] = $childDirectoryViews;
                    }
                }


                foreach ($filesystem->files($directory) as $file) {
                    if (strpos($file->getBaseName(), '.blade.php')) {
                        $fileName = str_replace('.blade.php', '', $file->getBaseName());
                        $views[] = $viewDirectory . '.' . $fileName;
                    }
                }
            }

            return $views;
        }

        $filesystem = new Illuminate\\Filesystem\\Filesystem;

        $views = [];

        foreach (app('view')->getFinder()->getPaths() as $path) {
            $views = array_merge($views, Illuminate\\Support\\Arr::flatten(getViewsFromDirectory($filesystem->directories($path), $filesystem)));
        }

        echo json_encode($views);
    `;

    return PHP.run(script);
}
