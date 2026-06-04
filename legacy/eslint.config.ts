//@ts-check

import { defineConfig } from "eslint/config";
import * as reactPlugin from 'eslint-plugin-react-hooks';


export default defineConfig({
	plugins: {
		reactPlugin
	}
})
