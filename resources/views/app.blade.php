<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>4B4T</title>
    @vite(['resources/css/app.css', 'resources/js/app.jsx'])
</head>
<body>
    <div id="app"></div>
    <script>
        window.serverStatus = @json($serverStatus ?? null);
        window.paginatedData = @json($paginatedData ?? null);
        window.isAdmin = @json($isAdmin ?? false);
        window.errors = @json($errors ?? []);
        window.csrfToken = "{{ csrf_token() }}";
    </script>
</body>
</html>
