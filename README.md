## Laravel Intellisense

<p align="center"><img src="https://user-images.githubusercontent.com/19809072/83678730-1a3cd480-a5d6-11ea-93d0-c5976ab507f1.gif" alt="demo"></p>

## Features
* Eloquent fields completions
* Model fields completions on Resource
* Model fields completions on Factories
* Route names completion in functions like route()
* View file name completions in functions like view() @include() ..
* Config names completion

## Laravel Ide helper
Laravel ide helper is a package that generates helper files that enable your IDE to provide accurate autocompletion. Generation is done based on the files in your project, so they are always up-to-date.

The package will help you generate a default ide helper file by just writing this command:
```
Generate Ide Helper
```

Or you can use the package directly to make it customizable with your project[laravel-ide-helper](https://github.com/barryvdh/laravel-ide-helper)

## Resource Autocompletion
For resource autocompletion to work you will have to specify model namespace on `Extensions>Laravel Intellisense>Model namespace` by default it is `App\`

<p align="center"><img src="https://user-images.githubusercontent.com/19809072/83809978-47a98100-a6af-11ea-905c-2ee360b43948.png" alt="resource"></p>

## Configuration
For the extension to work you need to have the database working! Since it needs the database to get the attributes.
