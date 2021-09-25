/**
 * @license
 * Copyright Akveo. All Rights Reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */
// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `.angular-cli.json`.

export const environment = {
  production: false,
  searchUrl: 'http://20.82.202.54:9200/leaflets/_search?q=',
  detailUrl: 'http://20.82.202.54:9200/leaflets/_search?q=',
  autocompleteUrl: 'http://20.82.202.54:9200/leaflets/_search?q=',
  ingestUrl: 'https://ingest.c14r.io/api/images/request'
};
