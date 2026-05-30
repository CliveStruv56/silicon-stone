import type { StructureResolver } from 'sanity/structure'
import { DocumentTextIcon, ImagesIcon } from '@sanity/icons'

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
        .title('Knowledge Inbox')
        .icon(DocumentTextIcon)
        .child(
          S.list()
            .title('Knowledge Inbox')
            .items([
              S.listItem()
                .title('Pending Sources')
                .child(
                  S.documentList()
                    .title('Pending Sources')
                    .schemaType('knowledgeSource')
                    .filter('_type == "knowledgeSource" && status == "pending"')
                ),
              S.listItem()
                .title('All Sources')
                .child(S.documentTypeList('knowledgeSource').title('All Sources')),
              S.listItem()
                .title('Candidates Awaiting Filing')
                .child(
                  S.documentList()
                    .title('Candidates Awaiting Filing')
                    .schemaType('knowledgeCandidate')
                    .filter('_type == "knowledgeCandidate" && status == "pending"')
                ),
              S.listItem()
                .title('All Candidates')
                .child(S.documentTypeList('knowledgeCandidate').title('All Candidates')),
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
            'knowledgeCandidate',
          ].includes(
            item.getId() ?? ''
          )
      ),
    ])
