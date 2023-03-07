# OpenAPI extensions

These are the extensions which we support and our own brand new ones!


## Existing extensions

These are the existing extensions we support:

- [x-unofficialSpec](https://github.com/APIs-guru/openapi-directory/wiki/specification-extensions#x-unofficialspec): Indicates the definition is produced by a third-party.


## x-logo

This extension adds a logo to the documentation. It is inspired by the `x-logo` extensions described [by Redocly](https://github.com/Redocly/redoc/blob/main/docs/redoc-vendor-extensions.md#x-logo) and [by APIs.guru](https://github.com/APIs-guru/openapi-directory/wiki/specification-extensions#x-logo), but our version adds the `path` field.

`x-logo` is the **Logo** object, described below.

`x-logo` is a property of [the Info object](https://spec.openapis.org/oas/v3.1.0#info-object).

### Logo Object

_Fixed Fields_

Either `url` or `path` MUST be provided. Giving both means undefined behaviour.

| Field Name | Type | Description |
| :-- | :-: | :-- |
| url | `string` | **_REQUIRED if `path` is not present._** URL of the logo. SHOULD be loadable by a web browser. SHOULD be an absolute URL so the API definition is usable from any location. |
| path | `string` | **_REQUIRED if `url` is not present._** Path to the logo file, relative to the OpenAPI file. |
| backgroundColor | `string` | Background colour for the logo. CSS color ([#RRGGBB](https://en.wikipedia.org/wiki/Web_colors#Hex_triplet)). |
| altText | `string` | Text to use for alt tag on the logo. Defaults to 'logo' if not given. |


## x-pages

This extension allows arbitrary markdown pages with extra documentation.

`x-pages` is an array of **Page** or **Separator** Objects, described below.

`x-pages` can be a property of:

- the root object.

### Page Object

_Fixed Fields_

| Field Name | Type | Description |
| :-- | :-: | :-- |
| name | `string` | **_REQUIRED._** The name of this page. |
| slug | `string` | Used as the page id / anchor. This must be unique across the entire file. If not given, it is auto-generated in a way that ensures it is unique. |
| tags | `[string]` | A list of tags for API documentation control. Tags can be used for logical grouping of operations by resources or any other qualifier. |
| content | `string` | Markdown, the page's content. |

### Separator Object

Notes a break between pages. This may be shown as, for example, a `<hr>` separator in a navigation bar, or in any other way. Multiple separators in a row should be collapsed into just one. Separators at the beginning or end of an array (not **between** two Page objects) should be ignored.

_Fixed Fields_

| Field Name | Type | Description |
| :-- | :-: | :-- |
| separator | `boolean` | **_REQUIRED._** True. Says that this is a separator. |

### x-pages examples

A simple list of extra pages:

```yaml
x-pages:
  - name: Authentication
    slut: auth
    tags:
      - api-basics
    content: |
      The API endpoints use OAuth. Here's how:
      ...

  - name: Weights and Volumes
    tags:
      - api-basics
    content: |
      We use weight and volume to determine the 'size' of your parcel.

      This page describes how to think about weights and volumes.
```

### x-pages todos

- Add `x-pages` field inside **Path** objects.
- Add `pages` field inside **Page** object for more complex layouts.
  - if done, maybe a way to specify which levels should result in page breaks and which should not be page breaks?
