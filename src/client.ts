/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleAuthOptions } from 'google-auth-library';

import { ApiClient } from './_api_client';
import { Auth } from './_auth';
import { Caches } from './caches';
import { Chats } from './chats';
import { Files } from './files';
import { Live } from './live';
import { Models } from './models';
import { NodeAuth } from './node/_node_auth';
import { Tunings } from './tunings';
import { HttpOptions } from './types';

const LANGUAGE_LABEL_PREFIX = 'gl-node/';

/**
 * Options for initializing the Client. The Client uses the parameters
 * for authentication purposes as well as to infer if SDK should send the
 * request to Vertex AI or Gemini API.
 */
export interface ClientInitOptions {
  // TODO: remove this once we split to separate web and node clients.
  /**
   * The object used for adding authentication headers to API requests.
   */
  auth?: Auth;
  /**
   * Optional. The Google Cloud project ID for Vertex AI users.
   * It is not the numeric project name.
   * If not provided, SDK will try to resolve it from runtime environment.
   */
  project?: string;
  /**
   * Optional. The Google Cloud project location for Vertex AI users.
   * If not provided, SDK will try to resolve it from runtime environment.
   */
  location?: string;
  /**
   * The API Key. This is required for Gemini API users.
   */
  apiKey?: string;
  /**
   * Optional. Set to true if you intend to call Vertex AI endpoints.
   * If unset, default SDK behavior is to call Gemini API.
   */
  vertexai?: boolean;
  /**
   * Optional. The API version for the endpoint.
   * If unset, SDK will choose a default api version.
   */
  apiVersion?: string;
  /**
   * Optional. These are the authentication options provided by google-auth-library for Vertex AI users.
   * Complete list of authentication options are documented in the
   * GoogleAuthOptions interface:
   * https://github.com/googleapis/google-auth-library-nodejs/blob/main/src/auth/googleauth.ts.
   */
  googleAuthOptions?: GoogleAuthOptions;
  /**
   * Optional. A set of customizable configuration for HTTP requests.
   */
  httpOptions?: HttpOptions;
}

export class Client {
  protected readonly apiClient: ApiClient;
  private readonly apiKey?: string;
  public readonly vertexai?: boolean;
  private readonly googleAuthOptions?: GoogleAuthOptions;
  private readonly project?: string;
  private readonly location?: string;
  private readonly apiVersion?: string;
  readonly models: Models;
  readonly live: Live;
  readonly tunings: Tunings;
  readonly chats: Chats;
  readonly caches: Caches;
  readonly files: Files;

  constructor(options: ClientInitOptions) {
    this.apiKey = options.apiKey ?? getEnv('GOOGLE_API_KEY');
    this.vertexai = options.vertexai ?? getBooleanEnv('GOOGLE_GENAI_USE_VERTEXAI') ?? false;
    this.project = options.project ?? getEnv('GOOGLE_CLOUD_PROJECT');
    this.location = options.location ?? getEnv('GOOGLE_CLOUD_LOCATION');
    this.apiVersion = options.apiVersion;
    this.apiClient = new ApiClient({
      auth: options.auth ? options.auth : new NodeAuth(options.googleAuthOptions),
      project: this.project,
      location: this.location,
      apiVersion: this.apiVersion,
      apiKey: this.apiKey,
      vertexai: this.vertexai,
      httpOptions: options.httpOptions,
      userAgentExtra: LANGUAGE_LABEL_PREFIX + process.version,
    });
    this.models = new Models(this.apiClient);
    this.live = new Live(this.apiClient);
    this.tunings = new Tunings(this.apiClient);
    this.chats = new Chats(this.models, this.apiClient);
    this.caches = new Caches(this.apiClient);
    this.files = new Files(this.apiClient);
  }
}

function getEnv(env: string): string | undefined {
  return process?.env?.[env]?.trim() ?? undefined;
}

function getBooleanEnv(env: string): boolean {
  return stringToBoolean(getEnv(env));
}

function stringToBoolean(str?: string): boolean {
  if (str === undefined) {
    return false;
  }
  return str.toLowerCase() === 'true';
}