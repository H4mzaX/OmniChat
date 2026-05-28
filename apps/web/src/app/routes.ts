import {
	type RouteConfigEntry,
	index,
	route,
} from '@react-router/dev/routes';

const pages = import.meta.glob('./**/page.jsx');

const routes: RouteConfigEntry[] = [];

for (const key of Object.keys(pages)) {
	// key is like "./page.jsx" or "./about/page.jsx" or "./blog/[id]/page.jsx"
	if (key === './page.jsx') {
		routes.push(index('./page.jsx'));
	} else {
		// e.g., "./blog/[id]/page.jsx" -> "blog/[id]"
		const pathPart = key.slice(2, -9); // remove "./" and "/page.jsx"
		
		const segments = pathPart.split('/');
		const processedSegments = segments.map((segment) => {
			if (segment.startsWith('[') && segment.endsWith(']')) {
				const paramName = segment.slice(1, -1);

				if (paramName.startsWith('...')) {
					return '*';
				}
				if (paramName.startsWith('[') && paramName.endsWith(']')) {
					return `:${paramName.slice(1, -1)}?`;
				}
				return `:${paramName}`;
			}
			return segment;
		});

		const routePath = processedSegments.join('/');
		routes.push(route(routePath, key));
	}
}

const notFound = route('*?', './__create/not-found.tsx');
routes.push(notFound);

export default routes;

