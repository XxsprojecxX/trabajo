| Componente | Tipo | Propósito | Imports | Env | IO | URL / BQ | Rutas Flask | GAPS |
|---|---|---|---|---|---|---|---|---|
| `backend/python_jobs/Analizer/comment_analizer.py` | analytics | Utilities to analyse batches of IG/TikTok comments. This module originally exposed a [...] | __future__, collections, dataclasses, datetime, google.api_core.exceptions, google.cloud, json, os | — | — | — / google.api_core.exceptions, os.path.exists, project.dataset.table | — | — |
| ↳ **limpiar_texto** | func | Limpia comentarios: elimina símbolos, links y minúsculas. | — | args: texto | — | — | — | — |
| ↳ **_extract_comment_text** | func | Return the textual content from different comment payload shapes. | — | args: comment | — | — | — | — |
| ↳ **_tokenise** | func | (sin doc) | — | args: comments | — | — | — | — |
| ↳ **_top_keywords** | func | (sin doc) | — | args: tokens, top_n | — | — | — | — |
| ↳ **_sentiment_for_comment** | func | (sin doc) | — | args: comment | — | — | — | — |
| ↳ **_sentiment_breakdown** | func | (sin doc) | — | args: comments | — | — | — | — |
| ↳ **analyze_comment_list** | func | Compute aggregated metrics (keywords + sentiment) from a comment list. | — | args: comments, top_n | — | — | — | — |
| ↳ **analizar_comentarios** | func | Legacy helper kept for backwards compatibility. The function now delegates to [...] | — | args: ruta_json, top_n | — | — | — | — |
| ↳ **save_metrics_to_bigquery** | func | Persist aggregated metrics to a BigQuery table. Parameters ---------- metrics: [...] | — | args: metrics, metadata, table_fqn, client, create_table_if_needed | — | — | — | — |
| ↳ **_ensure_metrics_table** | func | (sin doc) | — | args: client, table_fqn | — | — | — | — |
| ↳ **AggregatedMetrics** | class | Container for aggregated comment metrics. | — | — | — | — | — | — |
| `backend/python_jobs/Analizer/comment_metrics_job.py` | analytics | Scheduled job/Cloud Function to aggregate social media comments. The routine pulls [...] | __future__, collections, comment_analizer, datetime, google.cloud, json, os, sys | COMMENTS_METRICS_TABLE_FQN, COMMENTS_VIEW_FQN | — | — / os.path.dirname, os.path.abspath, sys.path.append | — | — |
| ↳ **_parse_timestamp** | func | (sin doc) | — | args: value | — | — | — | — |
| ↳ **_fetch_comments** | func | (sin doc) | — | args: client, view_fqn | — | — | — | — |
| ↳ **_aggregate_comment_groups** | func | (sin doc) | — | args: rows | — | — | — | — |
| ↳ **_persist_metrics** | func | (sin doc) | — | args: aggregated, table_fqn, client | — | — | — | — |
| ↳ **run_aggregation** | func | (sin doc) | — | args: — | — | — | — | — |
| ↳ **aggregate_comments_entry** | func | HTTP entry-point compatible with Cloud Functions. | — | args: request | — | — | — | — |
| ↳ **main** | func | (sin doc) | — | args: — | — | — | — | — |
| `backend/python_jobs/conversion/__init__.py` | otros | (sin doc) | — | — | — | http://www.apache.org/licenses/LICENSE-2.0 / www.apache.org | — | — |
| `backend/python_jobs/conversion/convert_yaml.py` | otros | A script for converting between legacy YAML and public JSON representation. Example [...] | __future__, argparse, googlecloudsdk.appengine.admin.tools.conversion, json, ruamel.yaml, sys | — | — | http://www.apache.org/licenses/LICENSE-2.0 / www.apache.org, googlecloudsdk.appengine.admin, googlecloudsdk.appengine.admin | — | — |
| ↳ **main** | func | (sin doc) | — | args: — | — | — | — | — |
| ↳ **GetSchemaParser** | func | (sin doc) | — | args: api_version | — | — | — | — |
| `backend/python_jobs/conversion/converters.py` | otros | Conversions to translate between legacy YAML and OnePlatform protos. | __future__, google.appengine.api, googlecloudsdk.appengine.api, re, typing | — | — | http://www.apache.org/licenses/LICENSE-2.0 / www.apache.org, googlecloudsdk.appengine.api, google.appengine.api | — | — |
| ↳ **_AppendRegexToPath** | func | Equivalent to os.path.join(), except uses forward slashes always. | — | args: path, regex | — | — | — | — |
| ↳ **_MoveFieldsTo** | func | Moves fields from source dict into a sub-dict under target_field_name. | — | args: source, field_names, target_field_name | — | — | — | — |
| ↳ **_ValidateRegexMatch** | func | Validate that a value matches a regex, raising ValueError otherwise. | — | args: value, regex, error_msg | — | — | — | — |
| ↳ **_GetHandlerType** | func | Get handler type of mapping. | — | args: handler | — | — | — | — |
| ↳ **ToVpcEgressSettingEnum** | func | Converts a string to a VPC egress setting. | — | args: value | — | — | — | — |
| ↳ **EnumConverter** | func | Create conversion function which translates from string to enum value. | — | args: prefix | — | — | — | — |
| ↳ **Not** | func | Convert the given boolean value to the opposite value. | — | args: value | — | — | — | — |
| ↳ **ToJsonString** | func | Coerces a primitive value into a JSON-compatible string. | — | args: value | — | — | — | — |
| ↳ **ToUpperCaseJsonString** | func | Coerces a primitive value into an upper-case JSON-compatible string. | — | args: value | — | — | — | — |
| ↳ **StringToInt** | func | Create conversion function which converts from a string to an integer. | — | args: handle_automatic | — | — | — | — |
| ↳ **SecondsToDuration** | func | Convert seconds expressed as integer to a Duration value. | — | args: value | — | — | — | — |
| ↳ **LatencyToDuration** | func | Convert valid pending latency argument to a Duration value of seconds. | — | args: value | — | — | — | — |
| ↳ **IdleTimeoutToDuration** | func | Convert valid idle timeout argument to a Duration value of seconds. | — | args: value | — | — | — | — |
| ↳ **ExpirationToDuration** | func | Convert valid expiration argument to a Duration value of seconds. | — | args: value | — | — | — | — |
| ↳ **ConvertAutomaticScaling** | func | Moves several VM-specific automatic scaling parameters to submessages. | — | args: automatic_scaling | — | — | — | — |
| ↳ **ConvertUrlHandler** | func | Rejiggers the structure of the url handler based on its type. | — | args: handler | — | — | — | — |
| ↳ **ConvertDispatchHandler** | func | Handles dispatch rules conversion. | — | args: handler | — | — | — | — |
| ↳ **ConvertEndpointsRolloutStrategyToEnum** | func | Converts the rollout strategy to an enum. | — | args: value | — | — | — | — |
| ↳ **ConvertEntrypoint** | func | Converts the raw entrypoint to a nested shell value. | — | args: entrypoint | — | — | — | — |
| `backend/python_jobs/conversion/schema.py` | otros | (sin doc) | __future__, logging | — | — | http://www.apache.org/licenses/LICENSE-2.0 / www.apache.org, self.fields.items, self.element.ConvertValue | — | — |
| ↳ **UnderscoreToLowerCamelCase** | func | Convert underscores to lower camel case (e.g. 'foo_bar' --> 'fooBar'). | — | args: text | — | — | — | — |
| ↳ **ValidateType** | func | (sin doc) | — | args: source_value, expected_type | — | — | — | — |
| ↳ **ValidateNotType** | func | (sin doc) | — | args: source_value, non_expected_type | — | — | — | — |
| ↳ **MergeDictionaryValues** | func | Attempts to merge the given dictionaries. Warns if a key exists with different [...] | — | args: old_dict, new_dict | — | — | — | — |
| ↳ **SchemaField** | class | Transformation strategy from input dictionary to an output dictionary. | — | — | — | — | — | — |
| ↳ **Message** | class | A message has a collection of fields which should be converted. | — | — | — | — | — | — |
| ↳ **Value** | class | Represents a leaf node. Only the value itself is copied. | — | — | — | — | — | — |
| ↳ **Map** | class | Represents a leaf node where the value itself is a map. | — | — | — | — | — | — |
| ↳ **RepeatedField** | class | Represents a list of nested elements. Each item in the list is copied. | — | — | — | — | — | — |
| `backend/python_jobs/conversion/yaml_schema_v1.py` | otros | Definition for conversion between legacy YAML and the API JSON formats. | __future__, googlecloudsdk.appengine.admin.tools.conversion | — | — | http://www.apache.org/licenses/LICENSE-2.0 / www.apache.org, googlecloudsdk.appengine.admin, googlecloudsdk.appengine.admin | — | — |
| `backend/python_jobs/conversion/yaml_schema_v1beta.py` | otros | Definition for conversion between legacy YAML and the API JSON formats. | __future__, googlecloudsdk.appengine.admin.tools.conversion | — | — | http://www.apache.org/licenses/LICENSE-2.0 / www.apache.org, googlecloudsdk.appengine.admin, googlecloudsdk.appengine.admin | — | — |
| `backend/python_jobs/orquestador/main.py` | backend-orquestador | (sin doc) | functions_framework, google.auth.transport.requests, google.cloud, google.oauth2.id_token, json, os, requests | — | — | https://us-central1-galletas-piloto-ju-250726.cloudfunctions.net/analizar_texto_individual / google.auth.transport, google.oauth2.id_token, us-central1-galletas-piloto-ju-250726.cloudfunctions.net | — | — |
| ↳ **llamar_analizador** | func | (sin doc) | — | args: texto | — | — | — | — |
| ↳ **guardar_en_bigquery** | func | (sin doc) | — | args: datos | — | — | — | — |
| ↳ **orquestar_analisis_conversacion** | func | (sin doc) | — | args: request | — | — | — | — |
| `backend/python_jobs/orquestador/recolector_final.py` | backend-orquestador | (sin doc) | — | — | — | — / — | — | — |
| `backend/python_jobs/orquestador/reparar_script.py` | backend-orquestador | (sin doc) | os | BRIGHTDATA_API_TOKEN, BRIGHTDATA_ZONE_NAME | — | https://api.brightdata.com/request / api.brightdata.com, requests.exceptions.HTTPError, e.response.status_code | — | — |
| `backend/python_jobs/recolector/diagnostico_selector.py` | ingestion | (sin doc) | datetime, dotenv, json, os, re, request, selenium, selenium.webdriver.chrome.service | INSTAGRAM_PASSWORD, INSTAGRAM_USERNAME | — | https://www.instagram.com/accounts/login/, https://www.instagram.com/p/DHcQE-gPk_F/ / selenium.webdriver.chrome, selenium.webdriver.common, selenium.webdriver.support | — | — |
| ↳ **parse_int_commas** | func | Convierte strings con comas a enteros. Ej: '1,234' -> 1234 | — | args: texto | — | — | — | — |
| ↳ **clean_text** | func | Limpia espacios y saltos de línea de un texto | — | args: txt | — | — | — | — |
| ↳ **standardize_instagram_post** | func | Devuelve un diccionario normalizado de un post de Instagram | — | args: raw | — | — | — | — |
| ↳ **login_instagram** | func | Inicia sesión en Instagram. | — | args: driver | — | — | — | — |
| `backend/python_jobs/recolector/instagram_scraper.py` | ingestion | (sin doc) | dotenv, os, selenium, selenium.webdriver.chrome.service, selenium.webdriver.common.by, selenium.webdriver.support, selenium.webdriver.support.ui, time | INSTAGRAM_PASSWORD, INSTAGRAM_USERNAME | — | https://www.instagram.com/accounts/login/ / selenium.webdriver.chrome, selenium.webdriver.common, selenium.webdriver.support | — | — |
| ↳ **login_instagram** | func | Inicia sesión en Instagram. | — | args: driver | — | — | — | — |
| ↳ **get_post_comments** | func | Extrae comentarios de un post de Instagram. | — | args: url_post, max_comments | — | — | — | — |
| `backend/python_jobs/recolector/tiktok_scraper.py` | ingestion | (sin doc) | dotenv, json, os, selenium, selenium.webdriver.chrome.service, selenium.webdriver.common.by, selenium.webdriver.support, selenium.webdriver.support.ui | — | — | https://www.tiktok.com/@usuario/video/1234567890 / selenium.webdriver.chrome, selenium.webdriver.common, selenium.webdriver.support | — | — |
| `backend/python_jobs/tools/__init__.py` | otros | (sin doc) | argparse, interegular, lark, logging, sys, textwrap, typing, warnings | — | — | — / namespace.start.append | — | — |
| ↳ **build_lalr** | func | (sin doc) | — | args: namespace | — | — | — | — |
| ↳ **showwarning_as_comment** | func | (sin doc) | — | args: message, category, filename, lineno, file, line | — | — | — | — |
| ↳ **make_warnings_comments** | func | (sin doc) | — | args: — | — | — | — | — |
| `backend/python_jobs/tools/app_engine_config_exception.py` | otros | Contains exception class for reporting XML parsing errors. | __future__ | — | — | http://www.apache.org/licenses/LICENSE-2.0 / www.apache.org | — | — |
| ↳ **AppEngineConfigException** | class | generic exception class for App Engine application configuration. | — | — | — | — | — | — |
| `backend/python_jobs/tools/append_memoria.py` | otros | (sin doc) | datetime, hashlib, json, pathlib, sys | — | — | — / sys.stdin.read, datetime.datetime.now | — | — |
| `backend/python_jobs/tools/appengine_rpc.py` | otros | Tool for performing authenticated RPCs against App Engine. | cookielib, fancy_urllib, googlecloudsdk.appengine._internal, googlecloudsdk.core.util, gzip, hashlib, http.cookiejar, io | — | — | http://%s/_ah/login, http://code.google.com/apis/accounts/AuthForInstalledApps.html, http://localhost/ / www.apache.org, googlecloudsdk.core.util, googlecloudsdk.appengine._internal | — | — |
| ↳ **can_validate_certs** | func | Return True if we have the SSL package and can validate certificates. | — | args: — | — | — | — | — |
| ↳ **GetPlatformToken** | func | Returns a 'User-agent' token for the host system platform. Args: os_module, [...] | — | args: os_module, sys_module, platform | — | — | — | — |
| ↳ **HttpRequestToString** | func | Converts a urllib2.Request to a string. Args: req: urllib2.Request Returns: Multi- [...] | — | args: req, include_data | — | — | — | — |
| ↳ **ClientLoginError** | class | Raised to indicate there was an error authenticating with ClientLogin. | — | — | — | — | — | — |
| ↳ **AbstractRpcServer** | class | Provides a common interface for a simple RPC server. | — | — | — | — | — | — |
| ↳ **ContentEncodingHandler** | class | Request and handle HTTP Content-Encoding. | — | — | — | — | — | — |
| ↳ **HttpRpcServer** | class | Provides a simplified RPC-style interface for HTTP requests. | — | — | — | — | — | — |
| `backend/python_jobs/tools/appengine_rpc_httplib2.py` | otros | Library with a variant of appengine_rpc using httplib2. The httplib2 module offers [...] | __future__, googlecloudsdk.appengine._internal, googlecloudsdk.appengine.tools.value_mixin, googlecloudsdk.core.util, httplib2, io, logging, oauth2client | — | — | http://%s/_ah/login, http://www.apache.org/licenses/LICENSE-2.0, https://%s/o/oauth2/token / www.apache.org, googlecloudsdk.core.util, googlecloudsdk.appengine.tools | — | — |
| ↳ **RaiseHttpError** | func | Raise a urllib2.HTTPError based on an httplib2 response tuple. | — | args: url, response_info, response_body, extra_msg | — | — | — | — |
| ↳ **_ScopesToString** | func | Converts scope value to a string. | — | args: scopes | — | — | — | — |
| ↳ **Error** | class | (sin doc) | — | — | — | — | — | — |
| ↳ **AuthPermanentFail** | class | Authentication will not succeed in the current context. | — | — | — | — | — | — |
| ↳ **MemoryCache** | class | httplib2 Cache implementation which only caches locally. | — | — | — | — | — | — |
| ↳ **HttpRpcServerHttpLib2** | class | A variant of HttpRpcServer which uses httplib2. This follows the same interface as [...] | — | — | — | — | — | — |
| ↳ **NoStorage** | class | A no-op implementation of storage. | — | — | — | — | — | — |
| ↳ **HttpRpcServerOAuth2** | class | A variant of HttpRpcServer which uses oauth2. This variant is specifically meant for [...] | — | — | — | — | — | — |
| `backend/python_jobs/tools/appengine_rpc_test_util.py` | otros | Utilities for testing code that uses appengine_rpc's *RpcServer. | __future__, googlecloudsdk.appengine._internal, googlecloudsdk.appengine.tools.appengine_rpc, io, logging, urllib.error, urllib2 | — | — | http://www.apache.org/licenses/LICENSE-2.0, https://www.google.com/accounts/ClientLogin / www.apache.org, googlecloudsdk.appengine.tools, googlecloudsdk.appengine.tools | — | — |
| ↳ **TestRpcServerMixin** | class | Provides a mocked-out version of HttpRpcServer for testing purposes. | — | — | — | — | — | — |
| ↳ **TestRpcServer** | class | (sin doc) | — | — | — | — | — | — |
| ↳ **TestHttpRpcServer** | class | (sin doc) | — | — | — | — | — | — |
| ↳ **UrlLibRequestResponseStub** | class | (sin doc) | — | — | — | — | — | — |
| ↳ **UrlLibRequestStub** | class | (sin doc) | — | — | — | — | — | — |
| ↳ **UrlLibResponseStub** | class | (sin doc) | — | — | — | — | — | — |
| `backend/python_jobs/tools/cmcdump.py` | otros | (sin doc) | pyasn1.codec.der, pyasn1_modules, sys | — | — | — / pyasn1.codec.der, pyasn1.codec.der | — | — |
| `backend/python_jobs/tools/cmpdump.py` | otros | (sin doc) | pyasn1, pyasn1.codec.der, pyasn1_modules, sys | — | — | http://pyasn1.sf.net/license.html / pyasn1.sf.net, pyasn1.codec.der, pyasn1.codec.der | — | — |
| `backend/python_jobs/tools/context_util.py` | otros | The implementation of generating a source context file. | googlecloudsdk.appengine._internal, json, logging, os, re, subprocess | — | — | http://www.apache.org/licenses/LICENSE-2.0, https://<hostname>/id/<repo_id>, https://<hostname>/p/<project_id> / www.apache.org, googlecloudsdk.appengine._internal, os.path.join | — | — |
| ↳ **_GetGitContextTypeFromDomain** | func | Returns the context type for the input Git url. | — | args: url | — | — | — | — |
| ↳ **_GetContextType** | func | Returns the _ContextType for the input extended source context. Args: context: A [...] | — | args: context, labels | — | — | — | — |
| ↳ **_IsRemoteBetter** | func | Indicates if a new remote is better than an old one, based on remote name. Names are [...] | — | args: new_name, old_name | — | — | — | — |
| ↳ **IsCaptureContext** | func | (sin doc) | — | args: context | — | — | — | — |
| ↳ **ExtendContextDict** | func | Converts a source context dict to an ExtendedSourceContext dict. Args: context: A [...] | — | args: context, category, remote_name | — | — | — | — |
| ↳ **HasPendingChanges** | func | Checks if the git repo in a directory has any pending changes. Args: [...] | — | args: source_directory | — | — | — | — |
| ↳ **CalculateExtendedSourceContexts** | func | Generate extended source contexts for a directory. Scans the remotes and revision of [...] | — | args: source_directory | — | — | — | — |
| ↳ **BestSourceContext** | func | Returns the "best" source context from a list of contexts. "Best" is a heuristic [...] | — | args: source_contexts | — | — | — | — |
| ↳ **GetSourceContextFilesCreator** | func | Returns a function to create source context files in the given directory. The [...] | — | args: output_dir, source_contexts, source_dir | — | — | — | — |
| ↳ **CreateContextFiles** | func | Creates source context file in the given directory if possible. Currently, only [...] | — | args: output_dir, source_contexts, overwrite, source_dir | — | — | — | — |
| ↳ **_CallGit** | func | Calls git with the given args, in the given working directory. Args: cwd: The [...] | — | args: cwd | — | — | — | — |
| ↳ **_GetGitRemoteUrlConfigs** | func | Calls git to output every configured remote URL. Args: source_directory: The path to [...] | — | args: source_directory | — | — | — | — |
| ↳ **_GetGitRemoteUrls** | func | Finds the list of git remotes for the given source directory. Args: [...] | — | args: source_directory | — | — | — | — |
| ↳ **_GetGitHeadRevision** | func | Finds the current HEAD revision for the given source directory. Args: [...] | — | args: source_directory | — | — | — | — |
| ↳ **_ParseSourceContext** | func | Parses the URL into a source context blob, if the URL is a git or GCP repo. Args: [...] | — | args: remote_name, remote_url, source_revision | — | — | — | — |
| ↳ **_GetJsonFileCreator** | func | Creates a creator function for an extended source context file. Args: name: (String) [...] | — | args: name, json_object | — | — | — | — |
| ↳ **_GetContextFileCreator** | func | Creates a creator function for an old-style source context file. Args: output_dir: [...] | — | args: output_dir, contexts | — | — | — | — |
| ↳ **_GetSourceContexts** | func | Gets the source contexts associated with a directory. This function is mostly a [...] | — | args: source_dir | — | — | — | — |
| ↳ **_ContextType** | class | Ordered enumeration of context types. The ordering is based on which context [...] | — | — | — | — | — | — |
| ↳ **GenerateSourceContextError** | class | An error occurred while trying to create the source context. | — | — | — | — | — | — |
| `backend/python_jobs/tools/crldump.py` | otros | (sin doc) | pyasn1.codec.der, pyasn1_modules, sys | — | — | http://pyasn1.sf.net/license.html / pyasn1.sf.net, pyasn1.codec.der, pyasn1.codec.der | — | — |
| `backend/python_jobs/tools/crmfdump.py` | otros | (sin doc) | pyasn1.codec.der, pyasn1_modules, sys | — | — | http://pyasn1.sf.net/license.html / pyasn1.sf.net, pyasn1.codec.der, pyasn1.codec.der | — | — |
| `backend/python_jobs/tools/cron_xml_parser.py` | otros | Directly processes text of cron.xml. CronXmlParser is called with an XML string to [...] | __future__, googlecloudsdk.appengine._internal, googlecloudsdk.appengine.googlecron, googlecloudsdk.appengine.tools, googlecloudsdk.appengine.tools.app_engine_config_exception, xml.etree | — | — | http://www.apache.org/licenses/LICENSE-2.0 / www.apache.org, googlecloudsdk.appengine.tools, googlecloudsdk.appengine.tools | — | — |
| ↳ **GetCronYaml** | func | (sin doc) | — | args: unused_application, cron_xml_str | — | — | — | — |
| ↳ **_MakeCronListIntoYaml** | func | Converts list of yaml statements describing cron jobs into a string. | — | args: cron_list | — | — | — | — |
| ↳ **_ProcessRetryParametersNode** | func | Converts <retry-parameters> in node to cron.retry_parameters. | — | args: node, cron | — | — | — | — |
| ↳ **CronXmlParser** | class | Provides logic for walking down XML tree and pulling data. | — | — | — | — | — | — |
| ↳ **_RetryParameters** | class | Object that contains retry xml tags converted to object attributes. | — | — | — | — | — | — |
| ↳ **Cron** | class | Instances contain information about individual cron entries. | — | — | — | — | — | — |
| `backend/python_jobs/tools/cvt_pyparsing_pep8_names.py` | otros | (sin doc) | argparse, difflib, functools, pathlib, pyparsing, sys | — | — | — / pp.util.make_compressed_re, sys.stdout.writelines | — | — |
| ↳ **camel_to_snake** | func | Convert CamelCase to snake_case. | — | args: s | — | — | — | — |
| `backend/python_jobs/tools/dispatch_xml_parser.py` | otros | Directly processes text of dispatch.xml. DispatchXmlParser is called with an XML [...] | __future__, googlecloudsdk.appengine.tools, googlecloudsdk.appengine.tools.app_engine_config_exception, xml.etree | — | — | http://www.apache.org/licenses/LICENSE-2.0 / www.apache.org, googlecloudsdk.appengine.tools, googlecloudsdk.appengine.tools | — | — |
| ↳ **GetDispatchYaml** | func | (sin doc) | — | args: application, dispatch_xml_str | — | — | — | — |
| ↳ **_MakeDispatchListIntoYaml** | func | Converts list of DispatchEntry objects into a YAML string. | — | args: application, dispatch_list | — | — | — | — |
| ↳ **DispatchXmlParser** | class | Provides logic for walking down XML tree and pulling data. | — | — | — | — | — | — |
| ↳ **DispatchEntry** | class | Instances contain information about individual dispatch entries. | — | — | — | — | — | — |
| `backend/python_jobs/tools/docker_appender_.py` | otros | This package appends a tarball to an image in a Docker Registry. | __future__, argparse, containerregistry.client, containerregistry.client.v2_2, containerregistry.tools, containerregistry.transport, httplib2, logging | — | — | http://www.apache.org/licenses/LICENSE-2.0 / www.apache.org, containerregistry.client.v2_2, containerregistry.client.v2_2 | — | — |
| ↳ **main** | func | (sin doc) | — | args: — | — | — | — | — |
| `backend/python_jobs/tools/docker_puller_.py` | otros | This package pulls images from a Docker Registry. | argparse, containerregistry.client, containerregistry.client.v2, containerregistry.client.v2_2, containerregistry.tools, containerregistry.transport, httplib2, logging | — | — | http://www.apache.org/licenses/LICENSE-2.0, https://docs.docker.com/registry/spec/manifest-v2-2/, https://github.com/opencontainers/image-spec / www.apache.org, containerregistry.client.v2, containerregistry.client.v2_2 | — | — |
| ↳ **_make_tag_if_digest** | func | (sin doc) | — | args: name | — | — | — | — |
| ↳ **main** | func | (sin doc) | — | args: — | — | — | — | — |
| `backend/python_jobs/tools/docker_pusher_.py` | otros | This package pushes images to a Docker Registry. | __future__, argparse, containerregistry.client, containerregistry.client.v2_2, containerregistry.tools, containerregistry.transport, httplib2, logging | — | — | http://www.apache.org/licenses/LICENSE-2.0 / www.apache.org, containerregistry.client.v2_2, containerregistry.client.v2_2 | — | — |
| ↳ **Tag** | func | Perform substitutions in the provided tag name. | — | args: name, files | — | — | — | — |
| ↳ **main** | func | (sin doc) | — | args: — | — | — | — | — |
| `backend/python_jobs/tools/dos_xml_parser.py` | otros | Directly processes text of dos.xml. DosXmlParser is called with an XML string to [...] | __future__, googlecloudsdk.appengine.tools, googlecloudsdk.appengine.tools.app_engine_config_exception, ipaddr, re, xml.etree | — | — | http://www.apache.org/licenses/LICENSE-2.0 / www.apache.org, googlecloudsdk.appengine.tools, googlecloudsdk.appengine.tools | — | — |
| ↳ **GetDosYaml** | func | (sin doc) | — | args: unused_application, dos_xml_str | — | — | — | — |
| ↳ **_MakeDosListIntoYaml** | func | Converts yaml statement list of blacklisted IP's into a string. | — | args: dos_list | — | — | — | — |
| ↳ **DosXmlParser** | class | Provides logic for walking down XML tree and pulling data. | — | — | — | — | — | — |
| ↳ **BlacklistEntry** | class | Instances contain information about individual blacklist entries. | — | — | — | — | — | — |
| `backend/python_jobs/tools/fast_flatten_.py` | otros | This package flattens image metadata into a single tarball. | __future__, argparse, containerregistry.client.v2_2, containerregistry.tools, logging, six.moves, tarfile | — | — | http://www.apache.org/licenses/LICENSE-2.0 / www.apache.org, containerregistry.client.v2_2 | — | — |
| ↳ **main** | func | (sin doc) | — | args: — | — | — | — | — |
| `backend/python_jobs/tools/fast_importer_.py` | otros | This package imports images from a 'docker save' tarball. Unlike 'docker save' the [...] | argparse, containerregistry.client.v2_2, containerregistry.tools, logging | — | — | http://www.apache.org/licenses/LICENSE-2.0 / www.apache.org, containerregistry.client.v2_2, containerregistry.client.v2_2 | — | — |
| ↳ **main** | func | (sin doc) | — | args: — | — | — | — | — |
| `backend/python_jobs/tools/fast_puller_.py` | otros | This package pulls images from a Docker Registry. Unlike docker_puller the format [...] | argparse, containerregistry.client, containerregistry.client.v2, containerregistry.client.v2_2, containerregistry.tools, containerregistry.transport, httplib2, logging | — | — | http://www.apache.org/licenses/LICENSE-2.0, https://docs.docker.com/registry/spec/manifest-v2-2/, https://github.com/opencontainers/image-spec / www.apache.org, containerregistry.client.v2, containerregistry.client.v2_2 | — | — |
| ↳ **main** | func | (sin doc) | — | args: — | — | — | — | — |
| `backend/python_jobs/tools/fast_pusher_.py` | otros | This package pushes images to a Docker Registry. The format this tool *expects* to [...] | __future__, argparse, containerregistry.client, containerregistry.client.v2_2, containerregistry.tools, containerregistry.transport, httplib2, logging | — | — | http://www.apache.org/licenses/LICENSE-2.0 / www.apache.org, containerregistry.client.v2_2, containerregistry.client.v2_2 | — | — |
| ↳ **Tag** | func | Perform substitutions in the provided tag name. | — | args: name, files | — | — | — | — |
| ↳ **main** | func | (sin doc) | — | args: — | — | — | — | — |
| `backend/python_jobs/tools/image_digester_.py` | otros | This package calculates the digest of an image. The format this tool *expects* to [...] | __future__, argparse, containerregistry.client.v2_2, containerregistry.tools, logging, six.moves, sys | — | — | http://www.apache.org/licenses/LICENSE-2.0 / www.apache.org, containerregistry.client.v2_2, containerregistry.client.v2_2 | — | — |
| ↳ **main** | func | (sin doc) | — | args: — | — | — | — | — |
| `backend/python_jobs/tools/logging_setup_.py` | otros | This package sets up the Python logging system. | logging, sys | — | — | http://www.apache.org/licenses/LICENSE-2.0 / www.apache.org, logging.root.addHandler, logging.root.setLevel | — | — |
| ↳ **DefineCommandLineArgs** | func | (sin doc) | — | args: argparser | — | — | — | — |
| ↳ **Init** | func | (sin doc) | — | args: args | — | — | — | — |
| ↳ **Formatter** | class | (sin doc) | — | — | — | — | — | — |
| `backend/python_jobs/tools/nearley.py` | otros | Converts Nearley grammars to Lark | argparse, codecs, js2py, lark, os.path, sys | — | — | — / os.path.join, os.path.abspath, os.path.dirname | — | — |
| ↳ **_get_rulename** | func | (sin doc) | — | args: name | — | — | — | — |
| ↳ **_nearley_to_lark** | func | (sin doc) | — | args: g, builtin_path, n2l, js_code, folder_path, includes | — | — | — | — |
| ↳ **create_code_for_nearley_grammar** | func | (sin doc) | — | args: g, start, builtin_path, folder_path, es6 | — | — | — | — |
| ↳ **main** | func | (sin doc) | — | args: fn, start, nearley_lib, es6 | — | — | — | — |
| ↳ **get_arg_parser** | func | (sin doc) | — | args: — | — | — | — | — |
| ↳ **NearleyToLark** | class | (sin doc) | — | — | — | — | — | — |
| `backend/python_jobs/tools/ocspclient.py` | otros | (sin doc) | hashlib, pyasn1.codec.der, pyasn1.type, pyasn1_modules, sys, urllib.request, urllib2 | — | — | http://pyasn1.sf.net/license.html / pyasn1.sf.net, pyasn1.codec.der, pyasn1.codec.der | — | — |
| ↳ **mkOcspRequest** | func | (sin doc) | — | args: issuerCert, userCert | — | — | — | — |
| ↳ **parseOcspResponse** | func | (sin doc) | — | args: ocspResponse | — | — | — | — |
| ↳ **ValueOnlyBitStringEncoder** | class | (sin doc) | — | — | — | — | — | — |
| `backend/python_jobs/tools/ocspreqdump.py` | otros | (sin doc) | pyasn1.codec.der, pyasn1_modules, sys | — | — | http://pyasn1.sf.net/license.html / pyasn1.sf.net, pyasn1.codec.der, pyasn1.codec.der | — | — |
| `backend/python_jobs/tools/ocsprspdump.py` | otros | (sin doc) | pyasn1.codec.der, pyasn1_modules, sys | — | — | http://pyasn1.sf.net/license.html / pyasn1.sf.net, pyasn1.codec.der, pyasn1.codec.der | — | — |
| `backend/python_jobs/tools/patched_.py` | otros | Context managers for patching libraries for use in PAR files. | httplib2, os, pkgutil, shutil, tempfile | — | — | http://www.apache.org/licenses/LICENSE-2.0 / www.apache.org, os.path.isfile, os.path.join | — | — |
| ↳ **_monkey_patch_httplib2** | func | Patch things so that httplib2 works properly in a PAR. Manually extract certificates [...] | — | args: extract_dir | — | — | — | — |
| ↳ **Httplib2** | class | (sin doc) | — | — | — | — | — | — |
| `backend/python_jobs/tools/pkcs10dump.py` | otros | (sin doc) | pyasn1.codec.der, pyasn1_modules, sys | — | — | http://pyasn1.sf.net/license.html / pyasn1.sf.net, pyasn1.codec.der, pyasn1.codec.der | — | — |
| `backend/python_jobs/tools/pkcs1dump.py` | otros | (sin doc) | pyasn1.codec.der, pyasn1_modules, sys | — | — | http://pyasn1.sf.net/license.html / pyasn1.sf.net, pyasn1.codec.der, pyasn1.codec.der | — | — |
| `backend/python_jobs/tools/pkcs7dump.py` | otros | (sin doc) | pyasn1.codec.der, pyasn1_modules, sys | — | — | http://pyasn1.sf.net/license.html / pyasn1.sf.net, pyasn1.codec.der, pyasn1.codec.der | — | — |
| `backend/python_jobs/tools/pkcs8dump.py` | otros | (sin doc) | pyasn1.codec.der, pyasn1_modules, sys | — | — | http://pyasn1.sf.net/license.html / pyasn1.sf.net, pyasn1.codec.der, pyasn1.codec.der | — | — |
| `backend/python_jobs/tools/platform_args_.py` | otros | This package defines a few functions to add and parse platforms arguments. These [...] | argparse, containerregistry.client.v2_2 | — | — | http://www.apache.org/licenses/LICENSE-2.0 / www.apache.org, containerregistry.client.v2_2 | — | — |
| ↳ **AddArguments** | func | Adds command-line arguments for platform fields. Args: parser: [...] | — | args: parser | — | — | — | — |
| ↳ **FromArgs** | func | Populates a docker_image_list.Platform object from the provided args. | — | args: args | — | — | — | — |
| `backend/python_jobs/tools/queue_xml_parser.py` | otros | Performs translation of queue.xml to queue.yaml. | __future__, googlecloudsdk.appengine.tools, googlecloudsdk.appengine.tools.app_engine_config_exception, sys, xml.etree | — | — | http://www.apache.org/licenses/LICENSE-2.0 / www.apache.org, googlecloudsdk.appengine.tools, googlecloudsdk.appengine.tools | — | — |
| ↳ **GetQueueYaml** | func | (sin doc) | — | args: unused_application, queue_xml_str | — | — | — | — |
| ↳ **main** | func | (sin doc) | — | args: — | — | — | — | — |
| ↳ **QueueXmlParser** | class | Provides logic for walking down XML tree and pulling data. | — | — | — | — | — | — |
| ↳ **QueueXml** | class | (sin doc) | — | — | — | — | — | — |
| ↳ **Queue** | class | (sin doc) | — | — | — | — | — | — |
| ↳ **PushQueue** | class | (sin doc) | — | — | — | — | — | — |
| ↳ **PullQueue** | class | (sin doc) | — | — | — | — | — | — |
| ↳ **Acl** | class | (sin doc) | — | — | — | — | — | — |
| ↳ **RetryParameters** | class | (sin doc) | — | — | — | — | — | — |
| `backend/python_jobs/tools/serialize.py` | otros | (sin doc) | argparse, json, lark.grammar, lark.lexer, lark.tools, sys | — | — | — / lark.tools.serialize | — | — |
| ↳ **serialize** | func | (sin doc) | — | args: lark_inst, outfile | — | — | — | — |
| ↳ **main** | func | (sin doc) | — | args: — | — | — | — | — |
| `backend/python_jobs/tools/snmpget.py` | otros | (sin doc) | pyasn1.codec.ber, pyasn1_modules, socket, sys | — | — | http://pyasn1.sf.net/license.html / pyasn1.sf.net, pyasn1.codec.ber, pyasn1.codec.ber | — | — |
| `backend/python_jobs/tools/standalone.py` | otros | (sin doc) | abc, argparse, base64, collections, collections.abc, functools, lark, lark.grammar | — | — | https://github.com/erezsh/lark, https://mozilla.org/MPL/2.0/., https://stackoverflow.com/questions/1769332/script-to-remove-python-comments-docstrings / os.path.join, lark.tools.standalone, ns.out.close | — | — |
| ↳ **extract_sections** | func | (sin doc) | — | args: lines | — | — | — | — |
| ↳ **strip_docstrings** | func | Strip comments and docstrings from a file. Based on code from: [...] | — | args: line_gen | — | — | — | — |
| ↳ **gen_standalone** | func | (sin doc) | — | args: lark_inst, output, out, compress | — | — | — | — |
| ↳ **main** | func | (sin doc) | — | args: — | — | — | — | — |
| `backend/python_jobs/tools/value_mixin.py` | otros | ValueMixin provides comparison and string methods based on fields. | __future__ | — | — | http://www.apache.org/licenses/LICENSE-2.0 / www.apache.org, self.__dict__.items, self.__class__.__name__ | — | — |
| ↳ **ValueMixin** | class | Provides simplistic but often sufficient comparison and string methods. | — | — | — | — | — | — |
| `backend/python_jobs/tools/x509dump-rfc5280.py` | otros | (sin doc) | pyasn1.codec.der, pyasn1_modules, sys | — | — | http://pyasn1.sf.net/license.html / pyasn1.sf.net, pyasn1.codec.der, pyasn1.codec.der | — | — |
| `backend/python_jobs/tools/x509dump.py` | otros | (sin doc) | pyasn1.codec.der, pyasn1_modules, sys | — | — | http://pyasn1.sf.net/license.html / pyasn1.sf.net, pyasn1.codec.der, pyasn1.codec.der | — | — |
| `backend/python_jobs/tools/xml_parser_utils.py` | otros | Contains some functions that come in handy with XML parsing. | __future__ | — | — | http://www.apache.org/licenses/LICENSE-2.0 / www.apache.org, node.tag.rsplit, node.attrib.get | — | — |
| ↳ **GetTag** | func | Strips namespace prefix. | — | args: node | — | — | — | — |
| ↳ **GetChild** | func | Returns first child of node with tag. | — | args: node, tag | — | — | — | — |
| ↳ **BooleanValue** | func | (sin doc) | — | args: node_text | — | — | — | — |
| ↳ **GetAttribute** | func | Wrapper function to retrieve attributes from XML nodes. | — | args: node, attr | — | — | — | — |
| ↳ **GetChildNodeText** | func | Finds child xml node with desired tag and returns its text. | — | args: node, child_tag, default | — | — | — | — |
| ↳ **GetNodeText** | func | Returns the node text after stripping whitespace. | — | args: node | — | — | — | — |
| ↳ **GetNodes** | func | Gets all children of a node with the desired tag. | — | args: node, match_tag | — | — | — | — |
| `backend/python_jobs/validador_web/main.py` | frontend | (sin doc) | flask | — | — | https://www.instagram.com/p/xyz123/ / www.instagram.com, 127.0.0 | /, / | — |
| ↳ **pagina_de_validacion** | func | Esta función se encarga de preparar los datos y mostrar la página de validación. | — | args: — | — | — | — | — |
| `ingestion/brightdata_connector.py` | ingestion | (sin doc) | dotenv, os, requests | BD_API_KEY, BRIGHTDATA_API_KEY | — | — / os.path.join, os.path.dirname | — | — |
| ↳ **get_bd_api_key** | func | (sin doc) | — | args: — | — | — | — | — |
| ↳ **bd_headers** | func | (sin doc) | — | args: use_x_api_key | — | — | — | — |
| ↳ **bd_get** | func | (sin doc) | — | args: url | — | — | — | — |
| ↳ **bd_post** | func | (sin doc) | — | args: url, json_body | — | — | — | — |
| ↳ **safe_json** | func | (sin doc) | — | args: resp | — | — | — | — |
| `maestro_ejecucion/main.py` | backend-orquestador | (sin doc) | bs4, glob, json, os, requests, subprocess, time | — | manifiesto.json | https://us-central1-galletas-piloto-ju-250726.cloudfunctions.net/orquestar_analisis_conversacion / us-central1-galletas-piloto-ju-250726.cloudfunctions.net, requests.exceptions.RequestException, os.path.basename | — | — |
| ↳ **get_gcloud_token** | func | Obtiene un token de identidad de gcloud para autenticar la petición. | — | args: — | — | — | — | — |
| ↳ **extraer_texto_de_html** | func | Usa BeautifulSoup para extraer el texto principal de la descripción de un post. | — | args: html_crudo, plataforma | — | — | — | — |
| ↳ **enviar_a_orquestador** | func | Envía los datos extraídos a la Cloud Function Orquestador. | — | args: texto_a_analizar, info_archivo, token | — | — | — | — |
| `xray_deep.py` | otros | (sin doc) | ast, datetime, json, os, pathlib, re, textwrap | — | — | — / project.dataset.table, galletas-piloto-ju-250726.analisis_galletas.resultados_analizados, fn.args.args | — | — |
| ↳ **read** | func | (sin doc) | — | args: p | — | — | — | — |
| ↳ **guess_group** | func | (sin doc) | — | args: path | — | — | — | — |
| ↳ **extract** | func | (sin doc) | — | args: p | — | — | — | — |
| ↳ **mod_candidates** | func | (sin doc) | — | args: p | — | — | — | — |
| ↳ **w** | func | (sin doc) | — | args: name, lines | — | — | — | — |
| ↳ **section_list** | func | (sin doc) | — | args: title, items | — | — | — | — |
| `xray_out/xray_inventory.py` | otros | (sin doc) | ast, collections, hashlib, json, os, pathlib, re, sys | — | — | — / n.func.attr, a.value.count, n.func.id | — | Import sospechoso: usar 'requests' |
| ↳ **read** | func | (sin doc) | — | args: p | — | — | — | — |
| ↳ **module_candidates** | func | (sin doc) | — | args: p | — | — | — | — |
| ↳ **extract_info** | func | (sin doc) | — | args: py_path | — | — | — | — |
| ↳ **gaps_for** | func | (sin doc) | — | args: info | — | — | — | — |
| ↳ **has_cycle** | func | (sin doc) | — | args: — | — | — | — | — |