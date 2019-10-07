/**
 * Response from cache
 */
self.addEventListener('fetch', event => {
    const response = self.caches.open('example')
        .then(caches => caches.match(event.request))
        .then(response => response || fetch(event.request));

    event.respondWith(response);
});

/**
 * Response to SSE by text
 */
self.addEventListener('fetch', event => {
    const {headers} = event.request;
    const isSSERequest = headers.get('Accept') === 'text/event-stream';

    if (!isSSERequest) {
        return;
    }

    event.respondWith(new Response('Hello!'));
});

/**
 * Response to SSE by stream
 */
self.addEventListener('fetch', event => {
    const {headers} = event.request;
    const isSSERequest = headers.get('Accept') === 'text/event-stream';

    if (!isSSERequest) {
        return;
    }

    const responseText = 'Hello!';
    const responseData = Uint8Array.from(responseText, x => x.charCodeAt(0));
    const stream = new ReadableStream({start: controller => controller.enqueue(responseData)});
    const response = new Response(stream);

    event.respondWith(response);
});

/**
 * SSE chunk data
 */
const sseChunkData = (data, event, retry, id) =>
    Object.entries({event, id, data, retry})
        .filter(([, value]) => ![undefined, null].includes(value))
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n') + '\n\n';

/**
 * Success response to SSE from SW
 */
self.addEventListener('fetch', event => {
    const {headers} = event.request;
    const isSSERequest = headers.get('Accept') === 'text/event-stream';

    if (!isSSERequest) {
        return;
    }

    const sseChunkData = (data, event, retry, id) =>
        Object.entries({event, id, data, retry})
            .filter(([, value]) => ![undefined, null].includes(value))
            .map(([key, value]) => `${key}: ${value}`)
            .join('\n') + '\n\n';

    const sseHeaders = {
        'content-type': 'text/event-stream',
        'Transfer-Encoding': 'chunked',
        'Connection': 'keep-alive',
    };

    const responseText = sseChunkData('Hello!');
    const responseData = Uint8Array.from(responseText, x => x.charCodeAt(0));
    const stream = new ReadableStream({start: controller => controller.enqueue(responseData)});
    const response = new Response(stream, {headers: sseHeaders});

    event.respondWith(response);
});

/**
 * Result
 */
self.addEventListener('fetch', event => {
    const {headers, url} = event.request;
    const isSSERequest = headers.get('Accept') === 'text/event-stream';

    // Process only SSE connections
    if (!isSSERequest) {
        return;
    }

    // Headers for SSE response
    const sseHeaders = {
        'content-type': 'text/event-stream',
        'Transfer-Encoding': 'chunked',
        'Connection': 'keep-alive',
    };
    // Function for formatting message to SSE response
    const sseChunkData = (data, event, retry, id) =>
        Object.entries({event, id, data, retry})
            .filter(([, value]) => ![undefined, null].includes(value))
            .map(([key, value]) => `${key}: ${value}`)
            .join('\n') + '\n\n';

    // Map with server connections, where key - url, value - EventSource
    const serverConnections = {};
    // For each request opens only one server connection and use it for next requests with the same url
    const getServerConnection = url => {
        if (!serverConnections[url]) {
            serverConnections[url] = new EventSource(url);
        }

        return serverConnections[url];
    };
    // On message from server forward it to browser
    const onServerMessage = (controller, {data, type, retry, lastEventId}) => {
        const responseText = sseChunkData(data, type, retry, lastEventId);
        const responseData = Uint8Array.from(responseText, x => x.charCodeAt(0));
        controller.enqueue(responseData);
    };
    const stream = new ReadableStream({
        start: controller => getServerConnection(url).onmessage = onServerMessage.bind(null, controller)
    });
    const response = new Response(stream, {headers: sseHeaders});

    event.respondWith(response);
});
