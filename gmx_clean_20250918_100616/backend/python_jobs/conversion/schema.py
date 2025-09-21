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
# schema.py - Versión adaptada para tu proyecto local

from __future__ import absolute_import
import logging

# Importamos los converters de tu módulo local (no del Google SDK)
from . import converters


def UnderscoreToLowerCamelCase(text):
    """Convert underscores to lower camel case (e.g. 'foo_bar' --> 'fooBar')."""
    parts = text.lower().split('_')
    return parts[0] + ''.join(part.capitalize() for part in parts[1:])


def ValidateType(source_value, expected_type):
    if not isinstance(source_value, expected_type):
        raise ValueError(
            'Expected a %s, but got %s for value %s' % (expected_type,
                                                        type(source_value),
                                                        source_value))


def ValidateNotType(source_value, non_expected_type):
    if isinstance(source_value, non_expected_type):
        raise ValueError(
            'Did not expect %s for value %s' % (non_expected_type, source_value))


def MergeDictionaryValues(old_dict, new_dict):
    """Attempts to merge the given dictionaries.

    Warns if a key exists with different values in both dictionaries. In this
    case, the new_dict value trumps the previous value.
    """
    common_keys = set(old_dict) & set(new_dict)
    if common_keys:
        conflicting_keys = set(key for key in common_keys
                               if old_dict[key] != new_dict[key])
        if conflicting_keys:
            def FormatKey(key):
                return ('\'{key}\' has conflicting values \'{old}\' and \'{new}\'. '
                        'Using \'{new}\'.').format(key=key,
                                                   old=old_dict[key],
                                                   new=new_dict[key])
            for conflicting_key in conflicting_keys:
                logging.warning(FormatKey(conflicting_key))
    result = old_dict.copy()
    result.update(new_dict)
    return result


class SchemaField(object):
    """Transformation strategy from input dictionary to an output dictionary."""

    def __init__(self, target_name=None, converter=None):
        self.target_name = target_name
        self.converter = converter

    def ConvertValue(self, value):
        result = self._VisitInternal(value)
        return self._PerformConversion(result)

    def _VisitInternal(self, value):
        raise NotImplementedError()

    def _PerformConversion(self, result):
        return self.converter(result) if self.converter else result


class Message(SchemaField):
    """A message has a collection of fields which should be converted."""

    def __init__(self, target_name=None, converter=None, preserve_names=False, **kwargs):
        super(Message, self).__init__(target_name, converter)
        self.fields = kwargs
        self.preserve_names = preserve_names
        if not self.fields:
            raise ValueError('Message must contain fields')

    def _VisitInternal(self, value):
        ValidateType(value, dict)
        result = {}
        for source_key, field_schema in self.fields.items():
            if source_key not in value:
                continue

            source_value = value[source_key]
            target_key = field_schema.target_name or source_key

            # Si preserve_names=False → aplica camelCase
            if not self.preserve_names:
                target_key = UnderscoreToLowerCamelCase(target_key)

            result_value = field_schema.ConvertValue(source_value)
            if target_key not in result:
                result[target_key] = result_value
            elif isinstance(result[target_key], dict) and isinstance(result_value, dict):
                result[target_key] = MergeDictionaryValues(result[target_key], result_value)
            else:
                raise ValueError('Target key "%s" already exists.' % target_key)

        return result


class Value(SchemaField):
    """Represents a leaf node. Only the value itself is copied."""

    def _VisitInternal(self, value):
        ValidateNotType(value, list)
        ValidateNotType(value, dict)
        return value


class Map(SchemaField):
    """Represents a leaf node where the value itself is a map."""

    def __init__(self, target_name=None, converter=None,
                 key_converter=converters.ToJsonString,
                 value_converter=converters.ToJsonString):
        super(Map, self).__init__(target_name, converter)
        self.key_converter = key_converter
        self.value_converter = value_converter

    def _VisitInternal(self, value):
        ValidateType(value, dict)
        result = {}
        for key, dict_value in value.items():
            if self.key_converter:
                key = self.key_converter(key)
            if self.value_converter:
                dict_value = self.value_converter(dict_value)
            result[key] = dict_value
        return result


class RepeatedField(SchemaField):
    """Represents a list of nested elements. Each item in the list is copied."""

    def __init__(self, target_name=None, converter=None, element=None):
        super(RepeatedField, self).__init__(target_name, converter)
        self.element = element

        if not self.element:
            raise ValueError('Element required for a repeated field')

        if isinstance(self.element, Map):
            raise ValueError('Repeated maps are not supported')

    def _VisitInternal(self, value):
        ValidateType(value, list)
        result = []
        for item in value:
            result.append(self.element.ConvertValue(item))
        return result


