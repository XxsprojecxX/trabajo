# Copyright 2016 Google LLC. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
"""Conversions to translate between legacy YAML and OnePlatform protos."""

from __future__ import absolute_import
import re
from typing import Any, Callable, Dict, Optional

# pylint:disable=g-import-not-at-top
try:
    from googlecloudsdk.appengine.api import dispatchinfo
except ImportError:
    from google.appengine.api import dispatchinfo
try:
    from googlecloudsdk.appengine.api import appinfo
except ImportError:
    from google.appengine.api import appinfo
# pylint:enable=g-import-not-at-top

_SECONDS_PER_MINUTE = 60
_MILLISECONDS_PER_SECOND = 1000
_NANOSECONDS_PER_SECOND = 1000000000

_COMMON_HANDLER_FIELDS = (
    'urlRegex',
    'login',
    'authFailAction',
    'securityLevel',
    'redirectHttpResponseCode',
)

_SCRIPT_FIELDS = ('scriptPath',)

_HANDLER_FIELDS = {
    'staticFiles': (
        'path',
        'uploadPathRegex',
        'httpHeaders',
        'expiration',
        'applicationReadable',
        'mimeType',
        'requireMatchingFile',
    ),
    'script': _SCRIPT_FIELDS,
    'apiEndpoint': _SCRIPT_FIELDS,
}

_REQUEST_UTILIZATION_SCALING_FIELDS = (
    'targetRequestCountPerSec',
    'targetConcurrentRequests',
    'targetRequestCountPerSecond',
)

_DISK_UTILIZATION_SCALING_FIELDS = (
    'targetWriteBytesPerSec',
    'targetWriteOpsPerSec',
    'targetReadBytesPerSec',
    'targetReadOpsPerSec',
    'targetWriteBytesPerSecond',
    'targetWriteOpsPerSecond',
    'targetReadBytesPerSecond',
    'targetReadOpsPerSecond',
)

_NETWORK_UTILIZATION_SCALING_FIELDS = (
    'targetSentBytesPerSec',
    'targetSentPacketsPerSec',
    'targetReceivedBytesPerSec',
    'targetReceivedPacketsPerSec',
    'targetSentBytesPerSecond',
    'targetSentPacketsPerSecond',
    'targetReceivedBytesPerSecond',
    'targetReceivedPacketsPerSecond',
)

_ENDPOINTS_ROLLOUT_STRATEGY_VALUES = ('fixed', 'managed')
_ENDPOINTS_UNSPECIFIED_ROLLOUT_STRATEGY_ENUM_VALUE = 'UNSPECIFIED_ROLLOUT_STRATEGY'

_STANDARD_SCHEDULER_SETTINGS = (
    'maxInstances',
    'minInstances',
    'targetCpuUtilization',
    'targetThroughputUtilization',
)

# Maps VPC egress setting as specified in app.yaml to their proto enum values.
_VPC_EGRESS_SETTING_MAP = {
    'all-traffic': 'ALL_TRAFFIC',
    'private-ranges-only': 'PRIVATE_IP_RANGES',
}


# ------------------------------
# Helpers
# ------------------------------

def _AppendRegexToPath(path: str, regex: str) -> str:
    """Equivalent to os.path.join(), except uses forward slashes always."""
    return path.rstrip('/') + '/' + regex


def _MoveFieldsTo(source: Dict[str, Any], field_names: tuple, target_field_name: str) -> None:
    """Moves fields from source dict into a sub-dict under target_field_name."""
    target: Dict[str, Any] = {}
    for field_name in field_names:
        if field_name in source:
            target[field_name] = source[field_name]
            del source[field_name]
    if target:
        source[target_field_name] = target


def _ValidateRegexMatch(value: str, regex: str, error_msg: str) -> None:
    """Validate that a value matches a regex, raising ValueError otherwise."""
    if not re.compile(regex).match(value):
        raise ValueError(f'{error_msg}: {value}')


def _GetHandlerType(handler: Dict[str, Any]) -> str:
    """Get handler type of mapping."""
    if 'apiEndpoint' in handler:
        return 'apiEndpoint'
    elif 'staticDir' in handler:
        return 'staticDirectory'
    elif 'path' in handler:
        return 'staticFiles'
    elif 'scriptPath' in handler:
        return 'script'
    raise ValueError(f'Unrecognized handler type: {handler}')


# ------------------------------
# Converters
# ------------------------------

def ToVpcEgressSettingEnum(value: str) -> str:
    """Converts a string to a VPC egress setting."""
    if str(value) not in _VPC_EGRESS_SETTING_MAP:
        raise ValueError(
            f'egress_setting must be one of: {", ".join(_VPC_EGRESS_SETTING_MAP.keys())}'
        )
    return _VPC_EGRESS_SETTING_MAP[str(value)]


def EnumConverter(prefix: str) -> Callable[[str], str]:
    """Create conversion function which translates from string to enum value."""
    if not prefix:
        raise ValueError('A prefix must be provided')
    if prefix != prefix.upper():
        raise ValueError('Upper-cased prefix must be provided')
    if prefix.endswith('_'):
        raise ValueError(f'Prefix should not contain a trailing underscore: "{prefix}"')

    return lambda value: '_'.join([prefix, str(value).upper()])


def Not(value: bool) -> bool:
    """Convert the given boolean value to the opposite value."""
    if not isinstance(value, bool):
        raise ValueError(f'Expected a boolean value. Got "{value}"')
    return not value


def ToJsonString(value: Any) -> str:
    """Coerces a primitive value into a JSON-compatible string."""
    if isinstance(value, (list, dict)):
        raise ValueError(f'Expected a primitive value. Got "{value}"')
    if isinstance(value, bool):
        return str(value).lower()
    return str(value)


def ToUpperCaseJsonString(value: Any) -> str:
    """Coerces a primitive value into an upper-case JSON-compatible string."""
    return str(value).upper()


def StringToInt(handle_automatic: bool = False) -> Callable[[str], int]:
    """Create conversion function which converts from a string to an integer."""
    def Convert(value: str) -> int:
        if value == 'automatic' and handle_automatic:
            return 0
        return int(value)
    return Convert


def SecondsToDuration(value: int) -> str:
    """Convert seconds expressed as integer to a Duration value."""
    return f'{int(value)}s'


def LatencyToDuration(value: str) -> Optional[str]:
    """Convert valid pending latency argument to a Duration value of seconds."""
    if value == 'automatic':
        return None
    _ValidateRegexMatch(value, appinfo._PENDING_LATENCY_REGEX, "Unrecognized latency")  # pylint: disable=protected-access
    if value.endswith('ms'):
        return f'{float(value[:-2]) / _MILLISECONDS_PER_SECOND}s'
    return value


def IdleTimeoutToDuration(value: str) -> str:
    """Convert valid idle timeout argument to a Duration value of seconds."""
    _ValidateRegexMatch(value, appinfo._IDLE_TIMEOUT_REGEX, "Unrecognized idle timeout")  # pylint: disable=protected-access
    if value.endswith('m'):
        return f'{int(value[:-1]) * _SECONDS_PER_MINUTE}s'
    return value


def ExpirationToDuration(value: str) -> str:
    """Convert valid expiration argument to a Duration value of seconds."""
    _ValidateRegexMatch(value, appinfo._EXPIRATION_REGEX, "Unrecognized expiration")  # pylint: disable=protected-access
    delta = appinfo.ParseExpiration(value)
    return f'{delta}s'


def ConvertAutomaticScaling(automatic_scaling: Dict[str, Any]) -> Dict[str, Any]:
    """Moves several VM-specific automatic scaling parameters to submessages."""
    _MoveFieldsTo(automatic_scaling, _REQUEST_UTILIZATION_SCALING_FIELDS, 'requestUtilization')
    _MoveFieldsTo(automatic_scaling, _DISK_UTILIZATION_SCALING_FIELDS, 'diskUtilization')
    _MoveFieldsTo(automatic_scaling, _NETWORK_UTILIZATION_SCALING_FIELDS, 'networkUtilization')
    _MoveFieldsTo(automatic_scaling, _STANDARD_SCHEDULER_SETTINGS, 'standardSchedulerSettings')
    return automatic_scaling


def ConvertUrlHandler(handler: Dict[str, Any]) -> Dict[str, Any]:
    """Rejiggers the structure of the url handler based on its type."""
    handler_type = _GetHandlerType(handler)

    if handler_type == 'staticDirectory':
        try:
            compiled = re.compile(handler['urlRegex'])
        except re.error:
            pass
        else:
            if compiled.groups:
                raise ValueError(
                    f'Groups are not allowed in URLs for static directory handlers: {handler["urlRegex"]}'
                )
        tmp = {
            'path': _AppendRegexToPath(handler['staticDir'], r'\1'),
            'uploadPathRegex': _AppendRegexToPath(handler['staticDir'], '.*'),
            'urlRegex': _AppendRegexToPath(handler['urlRegex'], '(.*)'),
        }
        del handler['staticDir']
        handler.update(tmp)
        handler_type = 'staticFiles'

    new_handler: Dict[str, Any] = {handler_type: {}}
    for field in _HANDLER_FIELDS[handler_type]:
        if field in handler:
            new_handler[handler_type][field] = handler[field]

    for common_field in _COMMON_HANDLER_FIELDS:
        if common_field in handler:
            new_handler[common_field] = handler[common_field]

    return new_handler


def ConvertDispatchHandler(handler: Dict[str, Any]) -> Dict[str, Any]:
    """Handles dispatch rules conversion."""
    dispatch_url = dispatchinfo.ParsedURL(handler['url'])
    dispatch_service = handler['service']

    dispatch_domain = (
        '*' + dispatch_url.host if not dispatch_url.host_exact else dispatch_url.host
    )
    dispatch_path = (
        dispatch_url.path.rstrip('/') + '/*'
        if not dispatch_url.path_exact
        else dispatch_url.path
    )

    return {
        'domain': dispatch_domain,
        'path': dispatch_path,
        'service': dispatch_service,
    }


def ConvertEndpointsRolloutStrategyToEnum(value: Optional[str]) -> str:
    """Converts the rollout strategy to an enum."""
    if value is None:
        return _ENDPOINTS_UNSPECIFIED_ROLLOUT_STRATEGY_ENUM_VALUE
    if value in _ENDPOINTS_ROLLOUT_STRATEGY_VALUES:
        return value.upper()
    raise ValueError(
        f'Unrecognized rollout strategy: {value}. Must be one of: {", ".join(_ENDPOINTS_ROLLOUT_STRATEGY_VALUES)}'
    )


def ConvertEntrypoint(entrypoint: Optional[str]) -> Dict[str, str]:
    """Converts the raw entrypoint to a nested shell value."""
    if entrypoint is None:
        entrypoint = ''
    if entrypoint.startswith('exec '):
        entrypoint = entrypoint[len('exec '):]
    return {'shell': entrypoint}

