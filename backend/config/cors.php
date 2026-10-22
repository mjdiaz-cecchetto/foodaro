<?php

return [
    'paths' => ['api/*', 'up'],
    'allowed_methods' => ['*'],
    // Orígenes del frontend Angular (ver CORS_ORIGENES en .env)
    'allowed_origins' => array_filter(array_map('trim', explode(',', (string) env('CORS_ORIGENES', 'http://localhost:4200')))),
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => false,
];
