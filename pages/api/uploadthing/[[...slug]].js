import { createRouteHandler } from "uploadthing/next-legacy";
import { ourFileRouter } from "../../../lib/uploadthing/server";

export default createRouteHandler({
	router: ourFileRouter,
});

export const config = {
	api: {
		bodyParser: false,
	},
};
