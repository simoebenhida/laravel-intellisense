# Laravel Intellisense

<p align="center"><img src="https://user-images.githubusercontent.com/19809072/83813946-4fb8ef00-a6b6-11ea-8f96-332a693972a8.gif" alt="demo"></p>

## Features
  - [Eloquent Autocompletion](#eloquent-autocompletion)
  - [Laravel Ide helper](#laravel-ide-helper)
  - [Resource Autocompletion](#resource-autocompletion)
  - [Factory Autocompletion](#factory-autocompletion)
  - [View Autocompletion](#view-autocompletion)
  - [Config Autocompletion](#config-autocompletion)
  - [Route Autocompletion](#route-autocompletion)
  - [Translate Autocompletion](#translate-autocompletion)
  - [Docker Support](#docker)
  - [Configuration](#configuration)

## Laravel Ide helper
Laravel ide helper is a package that generates helper files that enable your IDE to provide accurate autocompletion. Generation is done based on the files in your project, so they are always up-to-date.

The package will help you generate a default ide helper file by just writing this command:
```
Generate Ide Helper
```

Or you can use the package directly to make it customizable with your project[laravel-ide-helper](https://github.com/barryvdh/laravel-ide-helper)

## Resource Autocompletion
For resource autocompletion to work you will have to specify model namespace on `Settings>Extensions>Laravel Intellisense>Model namespace` by default it is `App\`

<p align="center"><img src="https://user-images.githubusercontent.com/19809072/83809978-47a98100-a6af-11ea-905c-2ee360b43948.png" alt="resource"></p>


## Eloquent Autocompletion

<p align="center"><img src="https://user-images.githubusercontent.com/19809072/83811079-0c0fb680-a6b1-11ea-9432-8c54165fe771.png" alt="model"></p>

<p align="center"><img src="https://user-images.githubusercontent.com/19809072/83811082-0dd97a00-a6b1-11ea-81b9-5b02f0d6d41f.png" alt="model"></p>

## Factory Autocompletion

<p align="center"><img src="https://user-images.githubusercontent.com/19809072/83811281-6e68b700-a6b1-11ea-9bb5-1baf2b38079e.png" alt="model"></p>

## View Autocompletion

<p align="center"><img src="https://user-images.githubusercontent.com/19809072/83811421-abcd4480-a6b1-11ea-8af2-60132be872ca.png" alt="model"></p>

## Config Autocompletion


<p align="center"><img src="https://user-images.githubusercontent.com/19809072/83811468-c7d0e600-a6b1-11ea-8cf1-bdeea1f93e9a.png" alt="model"></p>

## Route Autocompletion

<p align="center"><img src="https://user-images.githubusercontent.com/19809072/83811472-cacbd680-a6b1-11ea-889d-8be00e465bc5.png" alt="model"></p>

## Translate Autocompletion

<p align="center"><img src="https://user-images.githubusercontent.com/19809072/85328628-f67bf880-b4c8-11ea-8819-947f255b825c.png" alt="model"></p>

## Docker

If you are using docker you will have to add the container name where your application lives in `Settings>Extensions>Laravel Intellisense>Docker` so the extension can run the script from there to get the attributes!

For example if im using an `app` container! I will be adding: 
```
docker exec app
```

## Configuration

For the extension to work you need to have the database working! Since it needs the database to get the attributes.
