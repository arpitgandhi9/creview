import { GitHub } from '@actions/github/lib/utils'
import type { RestEndpointMethodTypes } from '@octokit/plugin-rest-endpoint-methods/dist-types/generated/parameters-and-response-types'
import { minimatch } from 'minimatch'
import * as core from '@actions/core'
import { ArrElement } from '../typeUtils'
import { retryWithBackoff } from '../httpUtils'
import { Effect, Context } from 'effect'
import { UnknownException } from 'effect/Cause'

export type PullRequestFileResponse = RestEndpointMethodTypes['pulls']['listFiles']['response']

export type PullRequestFile = ArrElement<PullRequestFileResponse['data']>
type CreateReviewCommentRequest = RestEndpointMethodTypes['pulls']['createReviewComment']['parameters']

type CreateReviewRequest = RestEndpointMethodTypes['pulls']['createReview']['parameters']

export interface PullRequestService {
  getFilesForReview: (
    owner: string,
    repo: string,
    pullNumber: number,
    excludeFilePatterns: string[]
  ) => Effect.Effect<PullRequestFile[], UnknownException, InstanceType<typeof GitHub>>
  createReviewComment: (
    requestOptions: CreateReviewCommentRequest
  ) => Effect.Effect<void, unknown, InstanceType<typeof GitHub>>
  createReview: (requestOptions: CreateReviewRequest) => Effect.Effect<void, unknown, InstanceType<typeof GitHub>>
}

export const octokitTag = Context.GenericTag<InstanceType<typeof GitHub>>('octokit')

export const PullRequestService = Context.GenericTag<PullRequestService>('PullRequestService')
export class PullRequestServiceImpl {
  private octokit: InstanceType<typeof GitHub>

  constructor(octokit: InstanceType<typeof GitHub>) {
    this.octokit = octokit
  }

  getFilesForReview = (
    owner: string,
    repo: string,
    pullNumber: number,
    excludeFilePatterns: string[]
  ): Effect.Effect<PullRequestFile[], UnknownException, never> => {
    const program = Effect.sync(() => this.octokit).pipe(
      Effect.flatMap(octokit =>
        retryWithBackoff(
          Effect.tryPromise(() => octokit.rest.pulls.listFiles({ owner, repo, pull_number: pullNumber, per_page: 100 }))
        )
      ),
      Effect.tap(pullRequestFiles => {
        if (!pullRequestFiles) {
          return Effect.sync(() => core.error('No response received from GitHub API'))
        }
        if (!pullRequestFiles.data) {
          return Effect.sync(() => core.error('No files data received from GitHub API'))
        }
        if (pullRequestFiles.data.length === 0) {
          return Effect.sync(() => core.warning('No files found in pull request'))
        }
        return Effect.sync(() =>
          core.info(
            `Original files for review ${pullRequestFiles.data.length}: ${pullRequestFiles.data.map(_ => _.filename)}`
          )
        )
      }),
      Effect.flatMap(pullRequestFiles =>
        Effect.sync(() => {
          try {
            const filteredFiles = pullRequestFiles.data.filter(file => {
              return (
                excludeFilePatterns.every(pattern => !minimatch(file.filename, pattern, { matchBase: true })) &&
                (file.status === 'modified' || file.status === 'added' || file.status === 'changed')
              )
            })
            
            if (filteredFiles.length === 0) {
              core.warning(`No files matched filter criteria. Total files: ${pullRequestFiles.data.length}`)
            }
            
            return filteredFiles
          } catch (error) {
            core.error(`Error filtering files: ${error}`)
            throw error
          }
        })
      ),
      Effect.tap(filteredFiles =>
        Effect.sync(() =>
          core.info(`Filtered files for review ${filteredFiles.length}: ${filteredFiles.map(_ => _.filename)}`)
        )
      )
    )

    return program
  }

  createReviewComment = (requestOptions: CreateReviewCommentRequest): Effect.Effect<void, Error, never> =>
    Effect.sync(() => this.octokit).pipe(
      Effect.tap(core.debug(`Creating review comment: ${JSON.stringify(requestOptions)}`)),
      Effect.flatMap(octokit =>
        retryWithBackoff(Effect.tryPromise(() => octokit.rest.pulls.createReviewComment(requestOptions)))
      )
    )

  createReview = (requestOptions: CreateReviewRequest): Effect.Effect<void, Error, never> =>
    Effect.sync(() => this.octokit).pipe(
      Effect.flatMap(octokit =>
        retryWithBackoff(Effect.tryPromise(() => octokit.rest.pulls.createReview(requestOptions)))
      )
    )
}
