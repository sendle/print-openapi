# OpenAPI extensions

These are the extensions which we support and our own brand new ones!

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