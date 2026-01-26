import PHP from "./index";

export interface RelationshipInfo {
  name: string;
  type: string;
  related: string;
}

export interface ModelInfo {
  attributes: string[];
  relationships: RelationshipInfo[];
  file?: string;
}

export async function getModelDetails(modelClass: string): Promise<ModelInfo | null> {
  // Escape the class name for PHP
  const escapedClass = modelClass.replace(/\\/g, "\\\\");

  const script = `
    $modelClass = '${escapedClass}';

    if (!class_exists($modelClass)) {
      echo json_encode(['error' => 'Class not found']);
      exit;
    }

    $model = new $modelClass;
    $attributes = [];
    $relationships = [];

    // Get attributes from table schema
    try {
      $table = $model->getTable();
      $connection = $model->getConnection();
      $attributes = $connection->getSchemaBuilder()->getColumnListing($table);
    } catch (Exception $e) {
      // Fallback: try to get from first record
      try {
        $first = $modelClass::first();
        if ($first) {
          $attributes = array_keys($first->getAttributes());
        }
      } catch (Exception $e2) {}
    }

    // Get relationships using reflection
    $reflection = new ReflectionClass($model);
    $relationshipTypes = [
      'Illuminate\\Database\\Eloquent\\Relations\\HasOne',
      'Illuminate\\Database\\Eloquent\\Relations\\HasMany',
      'Illuminate\\Database\\Eloquent\\Relations\\BelongsTo',
      'Illuminate\\Database\\Eloquent\\Relations\\BelongsToMany',
      'Illuminate\\Database\\Eloquent\\Relations\\HasOneThrough',
      'Illuminate\\Database\\Eloquent\\Relations\\HasManyThrough',
      'Illuminate\\Database\\Eloquent\\Relations\\MorphOne',
      'Illuminate\\Database\\Eloquent\\Relations\\MorphMany',
      'Illuminate\\Database\\Eloquent\\Relations\\MorphTo',
      'Illuminate\\Database\\Eloquent\\Relations\\MorphToMany',
      'Illuminate\\Database\\Eloquent\\Relations\\MorphedByMany',
    ];

    foreach ($reflection->getMethods(ReflectionMethod::IS_PUBLIC) as $method) {
      // Skip methods from parent classes
      if ($method->class !== $modelClass) continue;
      // Skip methods with parameters
      if ($method->getNumberOfParameters() > 0) continue;
      // Skip common non-relationship methods
      if (in_array($method->name, ['getTable', 'getKey', 'getKeyName', 'getRouteKey'])) continue;

      try {
        $returnType = $method->getReturnType();
        $isRelation = false;
        $relationType = null;

        // Check return type if available
        if ($returnType) {
          $typeName = $returnType->getName();
          foreach ($relationshipTypes as $relType) {
            if ($typeName === $relType || is_subclass_of($typeName, $relType)) {
              $isRelation = true;
              $relationType = class_basename($typeName);
              break;
            }
          }
        }

        // If no return type, try to call the method and check
        if (!$isRelation && !$returnType) {
          $result = $model->{$method->name}();
          foreach ($relationshipTypes as $relType) {
            if ($result instanceof $relType) {
              $isRelation = true;
              $relationType = class_basename($relType);
              break;
            }
          }

          if ($isRelation && method_exists($result, 'getRelated')) {
            $related = get_class($result->getRelated());
            $relationships[] = [
              'name' => $method->name,
              'type' => $relationType,
              'related' => $related,
            ];
          }
        } elseif ($isRelation) {
          // Get related model from calling the method
          $result = $model->{$method->name}();
          $related = method_exists($result, 'getRelated') ? get_class($result->getRelated()) : null;
          $relationships[] = [
            'name' => $method->name,
            'type' => $relationType,
            'related' => $related,
          ];
        }
      } catch (Exception $e) {
        // Skip methods that throw exceptions
      }
    }

    // Get file location
    $file = $reflection->getFileName();

    echo json_encode([
      'attributes' => array_values($attributes),
      'relationships' => $relationships,
      'file' => $file,
    ]);
  `;

  try {
    const result = await PHP.run(script);
    if (result) {
      const parsed = JSON.parse(result);
      if (parsed.error) {
        return null;
      }
      return parsed;
    }
  } catch {
    // Silently fail
  }

  return null;
}
