import type * as grpc from '@grpc/grpc-js';
import type { EnumTypeDefinition, MessageTypeDefinition } from '@grpc/proto-loader';

import type { Address as _envoy_config_core_v3_Address, Address__Output as _envoy_config_core_v3_Address__Output } from './envoy/config/core/v3/Address.js';
import type { AsyncDataSource as _envoy_config_core_v3_AsyncDataSource, AsyncDataSource__Output as _envoy_config_core_v3_AsyncDataSource__Output } from './envoy/config/core/v3/AsyncDataSource.js';
import type { BackoffStrategy as _envoy_config_core_v3_BackoffStrategy, BackoffStrategy__Output as _envoy_config_core_v3_BackoffStrategy__Output } from './envoy/config/core/v3/BackoffStrategy.js';
import type { BindConfig as _envoy_config_core_v3_BindConfig, BindConfig__Output as _envoy_config_core_v3_BindConfig__Output } from './envoy/config/core/v3/BindConfig.js';
import type { BuildVersion as _envoy_config_core_v3_BuildVersion, BuildVersion__Output as _envoy_config_core_v3_BuildVersion__Output } from './envoy/config/core/v3/BuildVersion.js';
import type { CidrRange as _envoy_config_core_v3_CidrRange, CidrRange__Output as _envoy_config_core_v3_CidrRange__Output } from './envoy/config/core/v3/CidrRange.js';
import type { ControlPlane as _envoy_config_core_v3_ControlPlane, ControlPlane__Output as _envoy_config_core_v3_ControlPlane__Output } from './envoy/config/core/v3/ControlPlane.js';
import type { DataSource as _envoy_config_core_v3_DataSource, DataSource__Output as _envoy_config_core_v3_DataSource__Output } from './envoy/config/core/v3/DataSource.js';
import type { EnvoyInternalAddress as _envoy_config_core_v3_EnvoyInternalAddress, EnvoyInternalAddress__Output as _envoy_config_core_v3_EnvoyInternalAddress__Output } from './envoy/config/core/v3/EnvoyInternalAddress.js';
import type { Extension as _envoy_config_core_v3_Extension, Extension__Output as _envoy_config_core_v3_Extension__Output } from './envoy/config/core/v3/Extension.js';
import type { ExtraSourceAddress as _envoy_config_core_v3_ExtraSourceAddress, ExtraSourceAddress__Output as _envoy_config_core_v3_ExtraSourceAddress__Output } from './envoy/config/core/v3/ExtraSourceAddress.js';
import type { HeaderMap as _envoy_config_core_v3_HeaderMap, HeaderMap__Output as _envoy_config_core_v3_HeaderMap__Output } from './envoy/config/core/v3/HeaderMap.js';
import type { HeaderValue as _envoy_config_core_v3_HeaderValue, HeaderValue__Output as _envoy_config_core_v3_HeaderValue__Output } from './envoy/config/core/v3/HeaderValue.js';
import type { HeaderValueOption as _envoy_config_core_v3_HeaderValueOption, HeaderValueOption__Output as _envoy_config_core_v3_HeaderValueOption__Output } from './envoy/config/core/v3/HeaderValueOption.js';
import type { HttpUri as _envoy_config_core_v3_HttpUri, HttpUri__Output as _envoy_config_core_v3_HttpUri__Output } from './envoy/config/core/v3/HttpUri.js';
import type { KeyValue as _envoy_config_core_v3_KeyValue, KeyValue__Output as _envoy_config_core_v3_KeyValue__Output } from './envoy/config/core/v3/KeyValue.js';
import type { KeyValueAppend as _envoy_config_core_v3_KeyValueAppend, KeyValueAppend__Output as _envoy_config_core_v3_KeyValueAppend__Output } from './envoy/config/core/v3/KeyValueAppend.js';
import type { KeyValueMutation as _envoy_config_core_v3_KeyValueMutation, KeyValueMutation__Output as _envoy_config_core_v3_KeyValueMutation__Output } from './envoy/config/core/v3/KeyValueMutation.js';
import type { KeyValuePair as _envoy_config_core_v3_KeyValuePair, KeyValuePair__Output as _envoy_config_core_v3_KeyValuePair__Output } from './envoy/config/core/v3/KeyValuePair.js';
import type { Locality as _envoy_config_core_v3_Locality, Locality__Output as _envoy_config_core_v3_Locality__Output } from './envoy/config/core/v3/Locality.js';
import type { Metadata as _envoy_config_core_v3_Metadata, Metadata__Output as _envoy_config_core_v3_Metadata__Output } from './envoy/config/core/v3/Metadata.js';
import type { Node as _envoy_config_core_v3_Node, Node__Output as _envoy_config_core_v3_Node__Output } from './envoy/config/core/v3/Node.js';
import type { Pipe as _envoy_config_core_v3_Pipe, Pipe__Output as _envoy_config_core_v3_Pipe__Output } from './envoy/config/core/v3/Pipe.js';
import type { QueryParameter as _envoy_config_core_v3_QueryParameter, QueryParameter__Output as _envoy_config_core_v3_QueryParameter__Output } from './envoy/config/core/v3/QueryParameter.js';
import type { RemoteDataSource as _envoy_config_core_v3_RemoteDataSource, RemoteDataSource__Output as _envoy_config_core_v3_RemoteDataSource__Output } from './envoy/config/core/v3/RemoteDataSource.js';
import type { RetryPolicy as _envoy_config_core_v3_RetryPolicy, RetryPolicy__Output as _envoy_config_core_v3_RetryPolicy__Output } from './envoy/config/core/v3/RetryPolicy.js';
import type { RuntimeDouble as _envoy_config_core_v3_RuntimeDouble, RuntimeDouble__Output as _envoy_config_core_v3_RuntimeDouble__Output } from './envoy/config/core/v3/RuntimeDouble.js';
import type { RuntimeFeatureFlag as _envoy_config_core_v3_RuntimeFeatureFlag, RuntimeFeatureFlag__Output as _envoy_config_core_v3_RuntimeFeatureFlag__Output } from './envoy/config/core/v3/RuntimeFeatureFlag.js';
import type { RuntimeFractionalPercent as _envoy_config_core_v3_RuntimeFractionalPercent, RuntimeFractionalPercent__Output as _envoy_config_core_v3_RuntimeFractionalPercent__Output } from './envoy/config/core/v3/RuntimeFractionalPercent.js';
import type { RuntimePercent as _envoy_config_core_v3_RuntimePercent, RuntimePercent__Output as _envoy_config_core_v3_RuntimePercent__Output } from './envoy/config/core/v3/RuntimePercent.js';
import type { RuntimeUInt32 as _envoy_config_core_v3_RuntimeUInt32, RuntimeUInt32__Output as _envoy_config_core_v3_RuntimeUInt32__Output } from './envoy/config/core/v3/RuntimeUInt32.js';
import type { SocketAddress as _envoy_config_core_v3_SocketAddress, SocketAddress__Output as _envoy_config_core_v3_SocketAddress__Output } from './envoy/config/core/v3/SocketAddress.js';
import type { SocketOption as _envoy_config_core_v3_SocketOption, SocketOption__Output as _envoy_config_core_v3_SocketOption__Output } from './envoy/config/core/v3/SocketOption.js';
import type { SocketOptionsOverride as _envoy_config_core_v3_SocketOptionsOverride, SocketOptionsOverride__Output as _envoy_config_core_v3_SocketOptionsOverride__Output } from './envoy/config/core/v3/SocketOptionsOverride.js';
import type { TcpKeepalive as _envoy_config_core_v3_TcpKeepalive, TcpKeepalive__Output as _envoy_config_core_v3_TcpKeepalive__Output } from './envoy/config/core/v3/TcpKeepalive.js';
import type { TransportSocket as _envoy_config_core_v3_TransportSocket, TransportSocket__Output as _envoy_config_core_v3_TransportSocket__Output } from './envoy/config/core/v3/TransportSocket.js';
import type { TypedExtensionConfig as _envoy_config_core_v3_TypedExtensionConfig, TypedExtensionConfig__Output as _envoy_config_core_v3_TypedExtensionConfig__Output } from './envoy/config/core/v3/TypedExtensionConfig.js';
import type { WatchedDirectory as _envoy_config_core_v3_WatchedDirectory, WatchedDirectory__Output as _envoy_config_core_v3_WatchedDirectory__Output } from './envoy/config/core/v3/WatchedDirectory.js';
import type { ProcessingMode as _envoy_extensions_filters_http_ext_proc_v3_ProcessingMode, ProcessingMode__Output as _envoy_extensions_filters_http_ext_proc_v3_ProcessingMode__Output } from './envoy/extensions/filters/http/ext_proc/v3/ProcessingMode.js';
import type { BodyMutation as _envoy_service_ext_proc_v3_BodyMutation, BodyMutation__Output as _envoy_service_ext_proc_v3_BodyMutation__Output } from './envoy/service/ext_proc/v3/BodyMutation.js';
import type { BodyResponse as _envoy_service_ext_proc_v3_BodyResponse, BodyResponse__Output as _envoy_service_ext_proc_v3_BodyResponse__Output } from './envoy/service/ext_proc/v3/BodyResponse.js';
import type { CommonResponse as _envoy_service_ext_proc_v3_CommonResponse, CommonResponse__Output as _envoy_service_ext_proc_v3_CommonResponse__Output } from './envoy/service/ext_proc/v3/CommonResponse.js';
import type { ExternalProcessorClient as _envoy_service_ext_proc_v3_ExternalProcessorClient, ExternalProcessorDefinition as _envoy_service_ext_proc_v3_ExternalProcessorDefinition } from './envoy/service/ext_proc/v3/ExternalProcessor.js';
import type { GrpcStatus as _envoy_service_ext_proc_v3_GrpcStatus, GrpcStatus__Output as _envoy_service_ext_proc_v3_GrpcStatus__Output } from './envoy/service/ext_proc/v3/GrpcStatus.js';
import type { HeaderMutation as _envoy_service_ext_proc_v3_HeaderMutation, HeaderMutation__Output as _envoy_service_ext_proc_v3_HeaderMutation__Output } from './envoy/service/ext_proc/v3/HeaderMutation.js';
import type { HeadersResponse as _envoy_service_ext_proc_v3_HeadersResponse, HeadersResponse__Output as _envoy_service_ext_proc_v3_HeadersResponse__Output } from './envoy/service/ext_proc/v3/HeadersResponse.js';
import type { HttpBody as _envoy_service_ext_proc_v3_HttpBody, HttpBody__Output as _envoy_service_ext_proc_v3_HttpBody__Output } from './envoy/service/ext_proc/v3/HttpBody.js';
import type { HttpHeaders as _envoy_service_ext_proc_v3_HttpHeaders, HttpHeaders__Output as _envoy_service_ext_proc_v3_HttpHeaders__Output } from './envoy/service/ext_proc/v3/HttpHeaders.js';
import type { HttpTrailers as _envoy_service_ext_proc_v3_HttpTrailers, HttpTrailers__Output as _envoy_service_ext_proc_v3_HttpTrailers__Output } from './envoy/service/ext_proc/v3/HttpTrailers.js';
import type { ImmediateResponse as _envoy_service_ext_proc_v3_ImmediateResponse, ImmediateResponse__Output as _envoy_service_ext_proc_v3_ImmediateResponse__Output } from './envoy/service/ext_proc/v3/ImmediateResponse.js';
import type { ProcessingRequest as _envoy_service_ext_proc_v3_ProcessingRequest, ProcessingRequest__Output as _envoy_service_ext_proc_v3_ProcessingRequest__Output } from './envoy/service/ext_proc/v3/ProcessingRequest.js';
import type { ProcessingResponse as _envoy_service_ext_proc_v3_ProcessingResponse, ProcessingResponse__Output as _envoy_service_ext_proc_v3_ProcessingResponse__Output } from './envoy/service/ext_proc/v3/ProcessingResponse.js';
import type { ProtocolConfiguration as _envoy_service_ext_proc_v3_ProtocolConfiguration, ProtocolConfiguration__Output as _envoy_service_ext_proc_v3_ProtocolConfiguration__Output } from './envoy/service/ext_proc/v3/ProtocolConfiguration.js';
import type { StreamedBodyResponse as _envoy_service_ext_proc_v3_StreamedBodyResponse, StreamedBodyResponse__Output as _envoy_service_ext_proc_v3_StreamedBodyResponse__Output } from './envoy/service/ext_proc/v3/StreamedBodyResponse.js';
import type { TrailersResponse as _envoy_service_ext_proc_v3_TrailersResponse, TrailersResponse__Output as _envoy_service_ext_proc_v3_TrailersResponse__Output } from './envoy/service/ext_proc/v3/TrailersResponse.js';
import type { FractionalPercent as _envoy_type_v3_FractionalPercent, FractionalPercent__Output as _envoy_type_v3_FractionalPercent__Output } from './envoy/type/v3/FractionalPercent.js';
import type { HttpStatus as _envoy_type_v3_HttpStatus, HttpStatus__Output as _envoy_type_v3_HttpStatus__Output } from './envoy/type/v3/HttpStatus.js';
import type { Percent as _envoy_type_v3_Percent, Percent__Output as _envoy_type_v3_Percent__Output } from './envoy/type/v3/Percent.js';
import type { SemanticVersion as _envoy_type_v3_SemanticVersion, SemanticVersion__Output as _envoy_type_v3_SemanticVersion__Output } from './envoy/type/v3/SemanticVersion.js';
import type { Any as _google_protobuf_Any, Any__Output as _google_protobuf_Any__Output } from './google/protobuf/Any.js';
import type { BoolValue as _google_protobuf_BoolValue, BoolValue__Output as _google_protobuf_BoolValue__Output } from './google/protobuf/BoolValue.js';
import type { BytesValue as _google_protobuf_BytesValue, BytesValue__Output as _google_protobuf_BytesValue__Output } from './google/protobuf/BytesValue.js';
import type { DescriptorProto as _google_protobuf_DescriptorProto, DescriptorProto__Output as _google_protobuf_DescriptorProto__Output } from './google/protobuf/DescriptorProto.js';
import type { DoubleValue as _google_protobuf_DoubleValue, DoubleValue__Output as _google_protobuf_DoubleValue__Output } from './google/protobuf/DoubleValue.js';
import type { Duration as _google_protobuf_Duration, Duration__Output as _google_protobuf_Duration__Output } from './google/protobuf/Duration.js';
import type { EnumDescriptorProto as _google_protobuf_EnumDescriptorProto, EnumDescriptorProto__Output as _google_protobuf_EnumDescriptorProto__Output } from './google/protobuf/EnumDescriptorProto.js';
import type { EnumOptions as _google_protobuf_EnumOptions, EnumOptions__Output as _google_protobuf_EnumOptions__Output } from './google/protobuf/EnumOptions.js';
import type { EnumValueDescriptorProto as _google_protobuf_EnumValueDescriptorProto, EnumValueDescriptorProto__Output as _google_protobuf_EnumValueDescriptorProto__Output } from './google/protobuf/EnumValueDescriptorProto.js';
import type { EnumValueOptions as _google_protobuf_EnumValueOptions, EnumValueOptions__Output as _google_protobuf_EnumValueOptions__Output } from './google/protobuf/EnumValueOptions.js';
import type { ExtensionRangeOptions as _google_protobuf_ExtensionRangeOptions, ExtensionRangeOptions__Output as _google_protobuf_ExtensionRangeOptions__Output } from './google/protobuf/ExtensionRangeOptions.js';
import type { FeatureSet as _google_protobuf_FeatureSet, FeatureSet__Output as _google_protobuf_FeatureSet__Output } from './google/protobuf/FeatureSet.js';
import type { FeatureSetDefaults as _google_protobuf_FeatureSetDefaults, FeatureSetDefaults__Output as _google_protobuf_FeatureSetDefaults__Output } from './google/protobuf/FeatureSetDefaults.js';
import type { FieldDescriptorProto as _google_protobuf_FieldDescriptorProto, FieldDescriptorProto__Output as _google_protobuf_FieldDescriptorProto__Output } from './google/protobuf/FieldDescriptorProto.js';
import type { FieldOptions as _google_protobuf_FieldOptions, FieldOptions__Output as _google_protobuf_FieldOptions__Output } from './google/protobuf/FieldOptions.js';
import type { FileDescriptorProto as _google_protobuf_FileDescriptorProto, FileDescriptorProto__Output as _google_protobuf_FileDescriptorProto__Output } from './google/protobuf/FileDescriptorProto.js';
import type { FileDescriptorSet as _google_protobuf_FileDescriptorSet, FileDescriptorSet__Output as _google_protobuf_FileDescriptorSet__Output } from './google/protobuf/FileDescriptorSet.js';
import type { FileOptions as _google_protobuf_FileOptions, FileOptions__Output as _google_protobuf_FileOptions__Output } from './google/protobuf/FileOptions.js';
import type { FloatValue as _google_protobuf_FloatValue, FloatValue__Output as _google_protobuf_FloatValue__Output } from './google/protobuf/FloatValue.js';
import type { GeneratedCodeInfo as _google_protobuf_GeneratedCodeInfo, GeneratedCodeInfo__Output as _google_protobuf_GeneratedCodeInfo__Output } from './google/protobuf/GeneratedCodeInfo.js';
import type { Int32Value as _google_protobuf_Int32Value, Int32Value__Output as _google_protobuf_Int32Value__Output } from './google/protobuf/Int32Value.js';
import type { Int64Value as _google_protobuf_Int64Value, Int64Value__Output as _google_protobuf_Int64Value__Output } from './google/protobuf/Int64Value.js';
import type { ListValue as _google_protobuf_ListValue, ListValue__Output as _google_protobuf_ListValue__Output } from './google/protobuf/ListValue.js';
import type { MessageOptions as _google_protobuf_MessageOptions, MessageOptions__Output as _google_protobuf_MessageOptions__Output } from './google/protobuf/MessageOptions.js';
import type { MethodDescriptorProto as _google_protobuf_MethodDescriptorProto, MethodDescriptorProto__Output as _google_protobuf_MethodDescriptorProto__Output } from './google/protobuf/MethodDescriptorProto.js';
import type { MethodOptions as _google_protobuf_MethodOptions, MethodOptions__Output as _google_protobuf_MethodOptions__Output } from './google/protobuf/MethodOptions.js';
import type { OneofDescriptorProto as _google_protobuf_OneofDescriptorProto, OneofDescriptorProto__Output as _google_protobuf_OneofDescriptorProto__Output } from './google/protobuf/OneofDescriptorProto.js';
import type { OneofOptions as _google_protobuf_OneofOptions, OneofOptions__Output as _google_protobuf_OneofOptions__Output } from './google/protobuf/OneofOptions.js';
import type { ServiceDescriptorProto as _google_protobuf_ServiceDescriptorProto, ServiceDescriptorProto__Output as _google_protobuf_ServiceDescriptorProto__Output } from './google/protobuf/ServiceDescriptorProto.js';
import type { ServiceOptions as _google_protobuf_ServiceOptions, ServiceOptions__Output as _google_protobuf_ServiceOptions__Output } from './google/protobuf/ServiceOptions.js';
import type { SourceCodeInfo as _google_protobuf_SourceCodeInfo, SourceCodeInfo__Output as _google_protobuf_SourceCodeInfo__Output } from './google/protobuf/SourceCodeInfo.js';
import type { StringValue as _google_protobuf_StringValue, StringValue__Output as _google_protobuf_StringValue__Output } from './google/protobuf/StringValue.js';
import type { Struct as _google_protobuf_Struct, Struct__Output as _google_protobuf_Struct__Output } from './google/protobuf/Struct.js';
import type { Timestamp as _google_protobuf_Timestamp, Timestamp__Output as _google_protobuf_Timestamp__Output } from './google/protobuf/Timestamp.js';
import type { UInt32Value as _google_protobuf_UInt32Value, UInt32Value__Output as _google_protobuf_UInt32Value__Output } from './google/protobuf/UInt32Value.js';
import type { UInt64Value as _google_protobuf_UInt64Value, UInt64Value__Output as _google_protobuf_UInt64Value__Output } from './google/protobuf/UInt64Value.js';
import type { UninterpretedOption as _google_protobuf_UninterpretedOption, UninterpretedOption__Output as _google_protobuf_UninterpretedOption__Output } from './google/protobuf/UninterpretedOption.js';
import type { Value as _google_protobuf_Value, Value__Output as _google_protobuf_Value__Output } from './google/protobuf/Value.js';
import type { FieldMigrateAnnotation as _udpa_annotations_FieldMigrateAnnotation, FieldMigrateAnnotation__Output as _udpa_annotations_FieldMigrateAnnotation__Output } from './udpa/annotations/FieldMigrateAnnotation.js';
import type { FileMigrateAnnotation as _udpa_annotations_FileMigrateAnnotation, FileMigrateAnnotation__Output as _udpa_annotations_FileMigrateAnnotation__Output } from './udpa/annotations/FileMigrateAnnotation.js';
import type { MigrateAnnotation as _udpa_annotations_MigrateAnnotation, MigrateAnnotation__Output as _udpa_annotations_MigrateAnnotation__Output } from './udpa/annotations/MigrateAnnotation.js';
import type { StatusAnnotation as _udpa_annotations_StatusAnnotation, StatusAnnotation__Output as _udpa_annotations_StatusAnnotation__Output } from './udpa/annotations/StatusAnnotation.js';
import type { VersioningAnnotation as _udpa_annotations_VersioningAnnotation, VersioningAnnotation__Output as _udpa_annotations_VersioningAnnotation__Output } from './udpa/annotations/VersioningAnnotation.js';
import type { AnyRules as _validate_AnyRules, AnyRules__Output as _validate_AnyRules__Output } from './validate/AnyRules.js';
import type { BoolRules as _validate_BoolRules, BoolRules__Output as _validate_BoolRules__Output } from './validate/BoolRules.js';
import type { BytesRules as _validate_BytesRules, BytesRules__Output as _validate_BytesRules__Output } from './validate/BytesRules.js';
import type { DoubleRules as _validate_DoubleRules, DoubleRules__Output as _validate_DoubleRules__Output } from './validate/DoubleRules.js';
import type { DurationRules as _validate_DurationRules, DurationRules__Output as _validate_DurationRules__Output } from './validate/DurationRules.js';
import type { EnumRules as _validate_EnumRules, EnumRules__Output as _validate_EnumRules__Output } from './validate/EnumRules.js';
import type { FieldRules as _validate_FieldRules, FieldRules__Output as _validate_FieldRules__Output } from './validate/FieldRules.js';
import type { Fixed32Rules as _validate_Fixed32Rules, Fixed32Rules__Output as _validate_Fixed32Rules__Output } from './validate/Fixed32Rules.js';
import type { Fixed64Rules as _validate_Fixed64Rules, Fixed64Rules__Output as _validate_Fixed64Rules__Output } from './validate/Fixed64Rules.js';
import type { FloatRules as _validate_FloatRules, FloatRules__Output as _validate_FloatRules__Output } from './validate/FloatRules.js';
import type { Int32Rules as _validate_Int32Rules, Int32Rules__Output as _validate_Int32Rules__Output } from './validate/Int32Rules.js';
import type { Int64Rules as _validate_Int64Rules, Int64Rules__Output as _validate_Int64Rules__Output } from './validate/Int64Rules.js';
import type { MapRules as _validate_MapRules, MapRules__Output as _validate_MapRules__Output } from './validate/MapRules.js';
import type { MessageRules as _validate_MessageRules, MessageRules__Output as _validate_MessageRules__Output } from './validate/MessageRules.js';
import type { RepeatedRules as _validate_RepeatedRules, RepeatedRules__Output as _validate_RepeatedRules__Output } from './validate/RepeatedRules.js';
import type { SFixed32Rules as _validate_SFixed32Rules, SFixed32Rules__Output as _validate_SFixed32Rules__Output } from './validate/SFixed32Rules.js';
import type { SFixed64Rules as _validate_SFixed64Rules, SFixed64Rules__Output as _validate_SFixed64Rules__Output } from './validate/SFixed64Rules.js';
import type { SInt32Rules as _validate_SInt32Rules, SInt32Rules__Output as _validate_SInt32Rules__Output } from './validate/SInt32Rules.js';
import type { SInt64Rules as _validate_SInt64Rules, SInt64Rules__Output as _validate_SInt64Rules__Output } from './validate/SInt64Rules.js';
import type { StringRules as _validate_StringRules, StringRules__Output as _validate_StringRules__Output } from './validate/StringRules.js';
import type { TimestampRules as _validate_TimestampRules, TimestampRules__Output as _validate_TimestampRules__Output } from './validate/TimestampRules.js';
import type { UInt32Rules as _validate_UInt32Rules, UInt32Rules__Output as _validate_UInt32Rules__Output } from './validate/UInt32Rules.js';
import type { UInt64Rules as _validate_UInt64Rules, UInt64Rules__Output as _validate_UInt64Rules__Output } from './validate/UInt64Rules.js';
import type { FieldStatusAnnotation as _xds_annotations_v3_FieldStatusAnnotation, FieldStatusAnnotation__Output as _xds_annotations_v3_FieldStatusAnnotation__Output } from './xds/annotations/v3/FieldStatusAnnotation.js';
import type { FileStatusAnnotation as _xds_annotations_v3_FileStatusAnnotation, FileStatusAnnotation__Output as _xds_annotations_v3_FileStatusAnnotation__Output } from './xds/annotations/v3/FileStatusAnnotation.js';
import type { MessageStatusAnnotation as _xds_annotations_v3_MessageStatusAnnotation, MessageStatusAnnotation__Output as _xds_annotations_v3_MessageStatusAnnotation__Output } from './xds/annotations/v3/MessageStatusAnnotation.js';
import type { StatusAnnotation as _xds_annotations_v3_StatusAnnotation, StatusAnnotation__Output as _xds_annotations_v3_StatusAnnotation__Output } from './xds/annotations/v3/StatusAnnotation.js';
import type { ContextParams as _xds_core_v3_ContextParams, ContextParams__Output as _xds_core_v3_ContextParams__Output } from './xds/core/v3/ContextParams.js';

type SubtypeConstructor<Constructor extends new (...args: any) => any, Subtype> = {
  new(...args: ConstructorParameters<Constructor>): Subtype;
};

export interface ProtoGrpcType {
  envoy: {
    annotations: {
    }
    config: {
      core: {
        v3: {
          Address: MessageTypeDefinition<_envoy_config_core_v3_Address, _envoy_config_core_v3_Address__Output>
          AsyncDataSource: MessageTypeDefinition<_envoy_config_core_v3_AsyncDataSource, _envoy_config_core_v3_AsyncDataSource__Output>
          BackoffStrategy: MessageTypeDefinition<_envoy_config_core_v3_BackoffStrategy, _envoy_config_core_v3_BackoffStrategy__Output>
          BindConfig: MessageTypeDefinition<_envoy_config_core_v3_BindConfig, _envoy_config_core_v3_BindConfig__Output>
          BuildVersion: MessageTypeDefinition<_envoy_config_core_v3_BuildVersion, _envoy_config_core_v3_BuildVersion__Output>
          CidrRange: MessageTypeDefinition<_envoy_config_core_v3_CidrRange, _envoy_config_core_v3_CidrRange__Output>
          ControlPlane: MessageTypeDefinition<_envoy_config_core_v3_ControlPlane, _envoy_config_core_v3_ControlPlane__Output>
          DataSource: MessageTypeDefinition<_envoy_config_core_v3_DataSource, _envoy_config_core_v3_DataSource__Output>
          EnvoyInternalAddress: MessageTypeDefinition<_envoy_config_core_v3_EnvoyInternalAddress, _envoy_config_core_v3_EnvoyInternalAddress__Output>
          Extension: MessageTypeDefinition<_envoy_config_core_v3_Extension, _envoy_config_core_v3_Extension__Output>
          ExtraSourceAddress: MessageTypeDefinition<_envoy_config_core_v3_ExtraSourceAddress, _envoy_config_core_v3_ExtraSourceAddress__Output>
          HeaderMap: MessageTypeDefinition<_envoy_config_core_v3_HeaderMap, _envoy_config_core_v3_HeaderMap__Output>
          HeaderValue: MessageTypeDefinition<_envoy_config_core_v3_HeaderValue, _envoy_config_core_v3_HeaderValue__Output>
          HeaderValueOption: MessageTypeDefinition<_envoy_config_core_v3_HeaderValueOption, _envoy_config_core_v3_HeaderValueOption__Output>
          HttpUri: MessageTypeDefinition<_envoy_config_core_v3_HttpUri, _envoy_config_core_v3_HttpUri__Output>
          KeyValue: MessageTypeDefinition<_envoy_config_core_v3_KeyValue, _envoy_config_core_v3_KeyValue__Output>
          KeyValueAppend: MessageTypeDefinition<_envoy_config_core_v3_KeyValueAppend, _envoy_config_core_v3_KeyValueAppend__Output>
          KeyValueMutation: MessageTypeDefinition<_envoy_config_core_v3_KeyValueMutation, _envoy_config_core_v3_KeyValueMutation__Output>
          KeyValuePair: MessageTypeDefinition<_envoy_config_core_v3_KeyValuePair, _envoy_config_core_v3_KeyValuePair__Output>
          Locality: MessageTypeDefinition<_envoy_config_core_v3_Locality, _envoy_config_core_v3_Locality__Output>
          Metadata: MessageTypeDefinition<_envoy_config_core_v3_Metadata, _envoy_config_core_v3_Metadata__Output>
          Node: MessageTypeDefinition<_envoy_config_core_v3_Node, _envoy_config_core_v3_Node__Output>
          Pipe: MessageTypeDefinition<_envoy_config_core_v3_Pipe, _envoy_config_core_v3_Pipe__Output>
          QueryParameter: MessageTypeDefinition<_envoy_config_core_v3_QueryParameter, _envoy_config_core_v3_QueryParameter__Output>
          RemoteDataSource: MessageTypeDefinition<_envoy_config_core_v3_RemoteDataSource, _envoy_config_core_v3_RemoteDataSource__Output>
          RequestMethod: EnumTypeDefinition
          RetryPolicy: MessageTypeDefinition<_envoy_config_core_v3_RetryPolicy, _envoy_config_core_v3_RetryPolicy__Output>
          RoutingPriority: EnumTypeDefinition
          RuntimeDouble: MessageTypeDefinition<_envoy_config_core_v3_RuntimeDouble, _envoy_config_core_v3_RuntimeDouble__Output>
          RuntimeFeatureFlag: MessageTypeDefinition<_envoy_config_core_v3_RuntimeFeatureFlag, _envoy_config_core_v3_RuntimeFeatureFlag__Output>
          RuntimeFractionalPercent: MessageTypeDefinition<_envoy_config_core_v3_RuntimeFractionalPercent, _envoy_config_core_v3_RuntimeFractionalPercent__Output>
          RuntimePercent: MessageTypeDefinition<_envoy_config_core_v3_RuntimePercent, _envoy_config_core_v3_RuntimePercent__Output>
          RuntimeUInt32: MessageTypeDefinition<_envoy_config_core_v3_RuntimeUInt32, _envoy_config_core_v3_RuntimeUInt32__Output>
          SocketAddress: MessageTypeDefinition<_envoy_config_core_v3_SocketAddress, _envoy_config_core_v3_SocketAddress__Output>
          SocketOption: MessageTypeDefinition<_envoy_config_core_v3_SocketOption, _envoy_config_core_v3_SocketOption__Output>
          SocketOptionsOverride: MessageTypeDefinition<_envoy_config_core_v3_SocketOptionsOverride, _envoy_config_core_v3_SocketOptionsOverride__Output>
          TcpKeepalive: MessageTypeDefinition<_envoy_config_core_v3_TcpKeepalive, _envoy_config_core_v3_TcpKeepalive__Output>
          TrafficDirection: EnumTypeDefinition
          TransportSocket: MessageTypeDefinition<_envoy_config_core_v3_TransportSocket, _envoy_config_core_v3_TransportSocket__Output>
          TypedExtensionConfig: MessageTypeDefinition<_envoy_config_core_v3_TypedExtensionConfig, _envoy_config_core_v3_TypedExtensionConfig__Output>
          WatchedDirectory: MessageTypeDefinition<_envoy_config_core_v3_WatchedDirectory, _envoy_config_core_v3_WatchedDirectory__Output>
        }
      }
    }
    extensions: {
      filters: {
        http: {
          ext_proc: {
            v3: {
              ProcessingMode: MessageTypeDefinition<_envoy_extensions_filters_http_ext_proc_v3_ProcessingMode, _envoy_extensions_filters_http_ext_proc_v3_ProcessingMode__Output>
            }
          }
        }
      }
    }
    service: {
      ext_proc: {
        v3: {
          BodyMutation: MessageTypeDefinition<_envoy_service_ext_proc_v3_BodyMutation, _envoy_service_ext_proc_v3_BodyMutation__Output>
          BodyResponse: MessageTypeDefinition<_envoy_service_ext_proc_v3_BodyResponse, _envoy_service_ext_proc_v3_BodyResponse__Output>
          CommonResponse: MessageTypeDefinition<_envoy_service_ext_proc_v3_CommonResponse, _envoy_service_ext_proc_v3_CommonResponse__Output>
          ExternalProcessor: SubtypeConstructor<typeof grpc.Client, _envoy_service_ext_proc_v3_ExternalProcessorClient> & { service: _envoy_service_ext_proc_v3_ExternalProcessorDefinition }
          GrpcStatus: MessageTypeDefinition<_envoy_service_ext_proc_v3_GrpcStatus, _envoy_service_ext_proc_v3_GrpcStatus__Output>
          HeaderMutation: MessageTypeDefinition<_envoy_service_ext_proc_v3_HeaderMutation, _envoy_service_ext_proc_v3_HeaderMutation__Output>
          HeadersResponse: MessageTypeDefinition<_envoy_service_ext_proc_v3_HeadersResponse, _envoy_service_ext_proc_v3_HeadersResponse__Output>
          HttpBody: MessageTypeDefinition<_envoy_service_ext_proc_v3_HttpBody, _envoy_service_ext_proc_v3_HttpBody__Output>
          HttpHeaders: MessageTypeDefinition<_envoy_service_ext_proc_v3_HttpHeaders, _envoy_service_ext_proc_v3_HttpHeaders__Output>
          HttpTrailers: MessageTypeDefinition<_envoy_service_ext_proc_v3_HttpTrailers, _envoy_service_ext_proc_v3_HttpTrailers__Output>
          ImmediateResponse: MessageTypeDefinition<_envoy_service_ext_proc_v3_ImmediateResponse, _envoy_service_ext_proc_v3_ImmediateResponse__Output>
          ProcessingRequest: MessageTypeDefinition<_envoy_service_ext_proc_v3_ProcessingRequest, _envoy_service_ext_proc_v3_ProcessingRequest__Output>
          ProcessingResponse: MessageTypeDefinition<_envoy_service_ext_proc_v3_ProcessingResponse, _envoy_service_ext_proc_v3_ProcessingResponse__Output>
          ProtocolConfiguration: MessageTypeDefinition<_envoy_service_ext_proc_v3_ProtocolConfiguration, _envoy_service_ext_proc_v3_ProtocolConfiguration__Output>
          StreamedBodyResponse: MessageTypeDefinition<_envoy_service_ext_proc_v3_StreamedBodyResponse, _envoy_service_ext_proc_v3_StreamedBodyResponse__Output>
          TrailersResponse: MessageTypeDefinition<_envoy_service_ext_proc_v3_TrailersResponse, _envoy_service_ext_proc_v3_TrailersResponse__Output>
        }
      }
    }
    type: {
      v3: {
        FractionalPercent: MessageTypeDefinition<_envoy_type_v3_FractionalPercent, _envoy_type_v3_FractionalPercent__Output>
        HttpStatus: MessageTypeDefinition<_envoy_type_v3_HttpStatus, _envoy_type_v3_HttpStatus__Output>
        Percent: MessageTypeDefinition<_envoy_type_v3_Percent, _envoy_type_v3_Percent__Output>
        SemanticVersion: MessageTypeDefinition<_envoy_type_v3_SemanticVersion, _envoy_type_v3_SemanticVersion__Output>
        StatusCode: EnumTypeDefinition
      }
    }
  }
  google: {
    protobuf: {
      Any: MessageTypeDefinition<_google_protobuf_Any, _google_protobuf_Any__Output>
      BoolValue: MessageTypeDefinition<_google_protobuf_BoolValue, _google_protobuf_BoolValue__Output>
      BytesValue: MessageTypeDefinition<_google_protobuf_BytesValue, _google_protobuf_BytesValue__Output>
      DescriptorProto: MessageTypeDefinition<_google_protobuf_DescriptorProto, _google_protobuf_DescriptorProto__Output>
      DoubleValue: MessageTypeDefinition<_google_protobuf_DoubleValue, _google_protobuf_DoubleValue__Output>
      Duration: MessageTypeDefinition<_google_protobuf_Duration, _google_protobuf_Duration__Output>
      Edition: EnumTypeDefinition
      EnumDescriptorProto: MessageTypeDefinition<_google_protobuf_EnumDescriptorProto, _google_protobuf_EnumDescriptorProto__Output>
      EnumOptions: MessageTypeDefinition<_google_protobuf_EnumOptions, _google_protobuf_EnumOptions__Output>
      EnumValueDescriptorProto: MessageTypeDefinition<_google_protobuf_EnumValueDescriptorProto, _google_protobuf_EnumValueDescriptorProto__Output>
      EnumValueOptions: MessageTypeDefinition<_google_protobuf_EnumValueOptions, _google_protobuf_EnumValueOptions__Output>
      ExtensionRangeOptions: MessageTypeDefinition<_google_protobuf_ExtensionRangeOptions, _google_protobuf_ExtensionRangeOptions__Output>
      FeatureSet: MessageTypeDefinition<_google_protobuf_FeatureSet, _google_protobuf_FeatureSet__Output>
      FeatureSetDefaults: MessageTypeDefinition<_google_protobuf_FeatureSetDefaults, _google_protobuf_FeatureSetDefaults__Output>
      FieldDescriptorProto: MessageTypeDefinition<_google_protobuf_FieldDescriptorProto, _google_protobuf_FieldDescriptorProto__Output>
      FieldOptions: MessageTypeDefinition<_google_protobuf_FieldOptions, _google_protobuf_FieldOptions__Output>
      FileDescriptorProto: MessageTypeDefinition<_google_protobuf_FileDescriptorProto, _google_protobuf_FileDescriptorProto__Output>
      FileDescriptorSet: MessageTypeDefinition<_google_protobuf_FileDescriptorSet, _google_protobuf_FileDescriptorSet__Output>
      FileOptions: MessageTypeDefinition<_google_protobuf_FileOptions, _google_protobuf_FileOptions__Output>
      FloatValue: MessageTypeDefinition<_google_protobuf_FloatValue, _google_protobuf_FloatValue__Output>
      GeneratedCodeInfo: MessageTypeDefinition<_google_protobuf_GeneratedCodeInfo, _google_protobuf_GeneratedCodeInfo__Output>
      Int32Value: MessageTypeDefinition<_google_protobuf_Int32Value, _google_protobuf_Int32Value__Output>
      Int64Value: MessageTypeDefinition<_google_protobuf_Int64Value, _google_protobuf_Int64Value__Output>
      ListValue: MessageTypeDefinition<_google_protobuf_ListValue, _google_protobuf_ListValue__Output>
      MessageOptions: MessageTypeDefinition<_google_protobuf_MessageOptions, _google_protobuf_MessageOptions__Output>
      MethodDescriptorProto: MessageTypeDefinition<_google_protobuf_MethodDescriptorProto, _google_protobuf_MethodDescriptorProto__Output>
      MethodOptions: MessageTypeDefinition<_google_protobuf_MethodOptions, _google_protobuf_MethodOptions__Output>
      NullValue: EnumTypeDefinition
      OneofDescriptorProto: MessageTypeDefinition<_google_protobuf_OneofDescriptorProto, _google_protobuf_OneofDescriptorProto__Output>
      OneofOptions: MessageTypeDefinition<_google_protobuf_OneofOptions, _google_protobuf_OneofOptions__Output>
      ServiceDescriptorProto: MessageTypeDefinition<_google_protobuf_ServiceDescriptorProto, _google_protobuf_ServiceDescriptorProto__Output>
      ServiceOptions: MessageTypeDefinition<_google_protobuf_ServiceOptions, _google_protobuf_ServiceOptions__Output>
      SourceCodeInfo: MessageTypeDefinition<_google_protobuf_SourceCodeInfo, _google_protobuf_SourceCodeInfo__Output>
      StringValue: MessageTypeDefinition<_google_protobuf_StringValue, _google_protobuf_StringValue__Output>
      Struct: MessageTypeDefinition<_google_protobuf_Struct, _google_protobuf_Struct__Output>
      SymbolVisibility: EnumTypeDefinition
      Timestamp: MessageTypeDefinition<_google_protobuf_Timestamp, _google_protobuf_Timestamp__Output>
      UInt32Value: MessageTypeDefinition<_google_protobuf_UInt32Value, _google_protobuf_UInt32Value__Output>
      UInt64Value: MessageTypeDefinition<_google_protobuf_UInt64Value, _google_protobuf_UInt64Value__Output>
      UninterpretedOption: MessageTypeDefinition<_google_protobuf_UninterpretedOption, _google_protobuf_UninterpretedOption__Output>
      Value: MessageTypeDefinition<_google_protobuf_Value, _google_protobuf_Value__Output>
    }
  }
  udpa: {
    annotations: {
      FieldMigrateAnnotation: MessageTypeDefinition<_udpa_annotations_FieldMigrateAnnotation, _udpa_annotations_FieldMigrateAnnotation__Output>
      FileMigrateAnnotation: MessageTypeDefinition<_udpa_annotations_FileMigrateAnnotation, _udpa_annotations_FileMigrateAnnotation__Output>
      MigrateAnnotation: MessageTypeDefinition<_udpa_annotations_MigrateAnnotation, _udpa_annotations_MigrateAnnotation__Output>
      PackageVersionStatus: EnumTypeDefinition
      StatusAnnotation: MessageTypeDefinition<_udpa_annotations_StatusAnnotation, _udpa_annotations_StatusAnnotation__Output>
      VersioningAnnotation: MessageTypeDefinition<_udpa_annotations_VersioningAnnotation, _udpa_annotations_VersioningAnnotation__Output>
    }
  }
  validate: {
    AnyRules: MessageTypeDefinition<_validate_AnyRules, _validate_AnyRules__Output>
    BoolRules: MessageTypeDefinition<_validate_BoolRules, _validate_BoolRules__Output>
    BytesRules: MessageTypeDefinition<_validate_BytesRules, _validate_BytesRules__Output>
    DoubleRules: MessageTypeDefinition<_validate_DoubleRules, _validate_DoubleRules__Output>
    DurationRules: MessageTypeDefinition<_validate_DurationRules, _validate_DurationRules__Output>
    EnumRules: MessageTypeDefinition<_validate_EnumRules, _validate_EnumRules__Output>
    FieldRules: MessageTypeDefinition<_validate_FieldRules, _validate_FieldRules__Output>
    Fixed32Rules: MessageTypeDefinition<_validate_Fixed32Rules, _validate_Fixed32Rules__Output>
    Fixed64Rules: MessageTypeDefinition<_validate_Fixed64Rules, _validate_Fixed64Rules__Output>
    FloatRules: MessageTypeDefinition<_validate_FloatRules, _validate_FloatRules__Output>
    Int32Rules: MessageTypeDefinition<_validate_Int32Rules, _validate_Int32Rules__Output>
    Int64Rules: MessageTypeDefinition<_validate_Int64Rules, _validate_Int64Rules__Output>
    KnownRegex: EnumTypeDefinition
    MapRules: MessageTypeDefinition<_validate_MapRules, _validate_MapRules__Output>
    MessageRules: MessageTypeDefinition<_validate_MessageRules, _validate_MessageRules__Output>
    RepeatedRules: MessageTypeDefinition<_validate_RepeatedRules, _validate_RepeatedRules__Output>
    SFixed32Rules: MessageTypeDefinition<_validate_SFixed32Rules, _validate_SFixed32Rules__Output>
    SFixed64Rules: MessageTypeDefinition<_validate_SFixed64Rules, _validate_SFixed64Rules__Output>
    SInt32Rules: MessageTypeDefinition<_validate_SInt32Rules, _validate_SInt32Rules__Output>
    SInt64Rules: MessageTypeDefinition<_validate_SInt64Rules, _validate_SInt64Rules__Output>
    StringRules: MessageTypeDefinition<_validate_StringRules, _validate_StringRules__Output>
    TimestampRules: MessageTypeDefinition<_validate_TimestampRules, _validate_TimestampRules__Output>
    UInt32Rules: MessageTypeDefinition<_validate_UInt32Rules, _validate_UInt32Rules__Output>
    UInt64Rules: MessageTypeDefinition<_validate_UInt64Rules, _validate_UInt64Rules__Output>
  }
  xds: {
    annotations: {
      v3: {
        FieldStatusAnnotation: MessageTypeDefinition<_xds_annotations_v3_FieldStatusAnnotation, _xds_annotations_v3_FieldStatusAnnotation__Output>
        FileStatusAnnotation: MessageTypeDefinition<_xds_annotations_v3_FileStatusAnnotation, _xds_annotations_v3_FileStatusAnnotation__Output>
        MessageStatusAnnotation: MessageTypeDefinition<_xds_annotations_v3_MessageStatusAnnotation, _xds_annotations_v3_MessageStatusAnnotation__Output>
        PackageVersionStatus: EnumTypeDefinition
        StatusAnnotation: MessageTypeDefinition<_xds_annotations_v3_StatusAnnotation, _xds_annotations_v3_StatusAnnotation__Output>
      }
    }
    core: {
      v3: {
        ContextParams: MessageTypeDefinition<_xds_core_v3_ContextParams, _xds_core_v3_ContextParams__Output>
      }
    }
  }
}

