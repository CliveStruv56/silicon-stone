import type { StructureResolver } from 'sanity/structure'
import {
  BulbOutlineIcon,
  DocumentTextIcon,
  ErrorOutlineIcon,
  ImagesIcon,
  SearchIcon,
  TagIcon,
} from '@sanity/icons'

/**
 * A source or item written before the canonical foundation wave has no
 * `reviewStatus`, only the legacy `status`. Every list below therefore asks the
 * question twice: the new field where it exists, the legacy field where it does
 * not. Filtering on `reviewStatus` alone would silently empty the inbox of
 * every record captured before this wave — which is most of them.
 */
const SOURCE_INBOX_FILTER =
  '_type == "knowledgeSource" && (reviewStatus == "inbox" || (!defined(reviewStatus) && status == "pending"))'
const SOURCE_READY_FILTER =
  '_type == "knowledgeSource" && (reviewStatus == "ready" || (!defined(reviewStatus) && status == "processed"))'
/** Legacy `error` was a capture or extraction problem, never an editorial
 * verdict, so it belongs with the things that need repair rather than with
 * rejections. */
const SOURCE_NEEDS_REPAIR_FILTER =
  '_type == "knowledgeSource" && (extractionState.status == "failed" || (!defined(reviewStatus) && status == "error"))'

// https://www.sanity.io/docs/structure-builder-cheat-sheet
export const structure: StructureResolver = (S) =>
  S.list()
    .title('Content')
    .items([
      // Data Management Singleton
      S.listItem()
        .title('Site Settings')
        .child(
          S.document()
            .schemaType('siteSettings')
            .documentId('siteSettings')
        ),
      S.divider(),
      // Image Library — browse by collection (folders) or see every image
      S.listItem()
        .title('Image Library')
        .icon(ImagesIcon)
        .child(
          S.list()
            .title('Image Library')
            .items([
              S.listItem()
                .title('Browse by Collection')
                .child(
                  S.documentTypeList('assetCollection')
                    .title('Collections')
                    .child((collectionId) =>
                      S.documentList()
                        .title('Images')
                        .schemaType('libraryImage')
                        .filter(
                          '_type == "libraryImage" && collection._ref == $collectionId'
                        )
                        .params({ collectionId })
                    )
                ),
              S.listItem()
                .title('All Images')
                .child(S.documentTypeList('libraryImage').title('All Images')),
              S.listItem()
                .title('Manage Collections')
                .child(
                  S.documentTypeList('assetCollection').title('Collections')
                ),
            ])
        ),
      S.divider(),
      S.listItem()
        .title('Knowledge')
        .icon(DocumentTextIcon)
        .child(
          S.list()
            .title('Knowledge')
            .items([
              S.listItem()
                .title('Inbox')
                .icon(DocumentTextIcon)
                .child(
                  S.list()
                    .title('Inbox')
                    .items([
                      S.listItem()
                        .title('Items Awaiting Review')
                        .child(
                          S.documentList()
                            .title('Items Awaiting Review')
                            .schemaType('knowledgeItem')
                            .filter(
                              '_type == "knowledgeItem" && (reviewStatus == "inbox" || !defined(reviewStatus))'
                            )
                        ),
                      S.listItem()
                        .title('Sources Awaiting Review')
                        .child(
                          S.documentList()
                            .title('Sources Awaiting Review')
                            .schemaType('knowledgeSource')
                            .filter(SOURCE_INBOX_FILTER)
                        ),
                    ])
                ),
              S.listItem()
                .title('Ready')
                .child(
                  S.list()
                    .title('Ready')
                    .items([
                      S.listItem()
                        .title('Ready Items')
                        .child(
                          S.documentList()
                            .title('Ready Items')
                            .schemaType('knowledgeItem')
                            .filter('_type == "knowledgeItem" && reviewStatus == "ready"')
                        ),
                      S.listItem()
                        .title('Ready Sources')
                        .child(
                          S.documentList()
                            .title('Ready Sources')
                            .schemaType('knowledgeSource')
                            .filter(SOURCE_READY_FILTER)
                        ),
                    ])
                ),
              S.divider(),
              S.listItem()
                .title('All Items')
                .icon(BulbOutlineIcon)
                .child(S.documentTypeList('knowledgeItem').title('All Items')),
              S.listItem()
                .title('All Sources')
                .icon(DocumentTextIcon)
                .child(S.documentTypeList('knowledgeSource').title('All Sources')),
              S.listItem()
                .title('Research Runs')
                .icon(SearchIcon)
                .child(
                  S.list()
                    .title('Research Runs')
                    .items([
                      S.listItem()
                        .title('In Flight')
                        .child(
                          S.documentList()
                            .title('In Flight')
                            .schemaType('researchRun')
                            .filter('_type == "researchRun" && status in ["queued", "running"]')
                        ),
                      S.listItem()
                        .title('Awaiting Reuse Decision')
                        .child(
                          S.documentList()
                            .title('Awaiting Reuse Decision')
                            .schemaType('researchRun')
                            .filter(
                              '_type == "researchRun" && status == "completed" && (reuseStatus == "pending" || !defined(reuseStatus))'
                            )
                        ),
                      S.listItem()
                        .title('Failed')
                        .child(
                          S.documentList()
                            .title('Failed')
                            .schemaType('researchRun')
                            .filter('_type == "researchRun" && status == "failed"')
                        ),
                      S.listItem()
                        .title('All Runs')
                        .child(S.documentTypeList('researchRun').title('All Runs')),
                    ])
                ),
              S.listItem()
                .title('Topics')
                .icon(TagIcon)
                .child(S.documentTypeList('knowledgeTopic').title('Topics')),
              S.divider(),
              S.listItem()
                .title('Needs Attention')
                .icon(ErrorOutlineIcon)
                .child(
                  S.list()
                    .title('Needs Attention')
                    .items([
                      S.listItem()
                        .title('Index Errors')
                        .child(
                          // Two types, one list: an operator clearing index
                          // failures does not care which document type failed.
                          // The id is set explicitly because this is the only
                          // list here without a schemaType, and `serialize()`
                          // requires an id — deriving it from the title would
                          // work, but not visibly.
                          S.documentList()
                            .id('knowledge-index-errors')
                            .title('Index Errors')
                            .filter(
                              '_type in ["knowledgeSource", "knowledgeItem"] && indexState.status == "error"'
                            )
                        ),
                      S.listItem()
                        .title('Extraction Problems')
                        .child(
                          S.documentList()
                            .title('Extraction Problems')
                            .schemaType('knowledgeSource')
                            .filter(SOURCE_NEEDS_REPAIR_FILTER)
                        ),
                    ])
                ),
              S.divider(),
              S.listItem()
                .title('Legacy (pre-foundation)')
                .child(
                  S.list()
                    .title('Legacy (pre-foundation)')
                    .items([
                      S.listItem()
                        .title('Candidates Awaiting Filing (legacy)')
                        .child(
                          S.documentList()
                            .title('Candidates Awaiting Filing (legacy)')
                            .schemaType('knowledgeCandidate')
                            .filter('_type == "knowledgeCandidate" && status == "pending"')
                        ),
                      S.listItem()
                        .title('All Candidates (legacy)')
                        .child(
                          S.documentTypeList('knowledgeCandidate').title(
                            'All Candidates (legacy)'
                          )
                        ),
                      S.listItem()
                        .title('Sources by Legacy Status')
                        .child(
                          S.documentList()
                            .title('Sources by Legacy Status')
                            .schemaType('knowledgeSource')
                            .filter('_type == "knowledgeSource" && !defined(reviewStatus)')
                        ),
                    ])
                ),
            ])
        ),
      S.divider(),
      // The rest of the documents, filtering out the singleton + library types
      ...S.documentTypeListItems().filter(
        (item) =>
          ![
            'siteSettings',
            'assetCollection',
            'libraryImage',
            'knowledgeSource',
            'knowledgeItem',
            'knowledgeTopic',
            'researchRun',
            'knowledgeCandidate',
          ].includes(
            item.getId() ?? ''
          )
      ),
    ])
