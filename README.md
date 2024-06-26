# tautuilli-notification-digest

[![Latest Release](https://img.shields.io/github/v/release/foxxmd/tautulli-notification-digest)](https://github.com/FoxxMD/tautulli-notification-digest/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Docker Pulls](https://img.shields.io/docker/pulls/foxxmd/tautulli-notification-digest)](https://hub.docker.com/r/foxxmd/tautulli-notification-digest)

<img src="/docs/assets/icon.png" align="right"
alt="multi-scrobbler logo" height="180">

tautuilli-notification-digest (TND) creates "digest" (timed summary) notifications of **Media Added** events for discord using [Tautulli's](https://tautulli.com/) discord [notification agent](https://github.com/Tautulli/Tautulli/wiki/Notification-Agents-Guide#discord).

<!-- TOC -->
* [What Does It Do?](#what-does-it-do)
* [Quick Start](#quick-start)
* [Install](#install)
  * [Docker](#docker)
  * [Local (Node)](#local-node)
* [Setup](#setup)
  * [Tautulli](#tautulli)
  * [Configuration](#configuration)
    * [ENV](#env)
      * [Docker](#docker-1)
      * [Local](#local)
    * [File](#file)
      * [Docker](#docker-2)
      * [Local](#local-1)
* [Run](#run)
  * [Docker](#docker-3)
  * [Local](#local-2)
* [Options](#options)
  * [Embed Formats](#embed-formats)
    * [Poster](#poster)
    * [Thumbnail](#thumbnail)
    * [Text](#text)
    * [List](#list)
    * [Embed Format Collapse](#embed-format-collapse)
      * [Default Collapse Settings](#default-collapse-settings)
      * [Overflow](#overflow)
  * [Deduplication Behavior](#deduplication-behavior)
* [API](#api)
  * [Tautuilli Webhook](#tautuilli-webhook)
  * [Run Pending Notifications](#run-pending-notifications)
<!-- TOC -->

# What Does It Do?

Tautulli already provides an email "newsletter" that compiles triggered events (media added) from Plex and then sends it as one email at a set time.

This same functionality **does not exist** for notifications. This functionality is often requested for [discord](https://www.reddit.com/r/PleX/comments/tzadtv/guide_for_setting_up_discord_andor_tautulli/) and there are even some [existing guides](https://forums.serverbuilds.net/t/guide-timed-summary-plex-to-discord-notifications-with-tautulli/4505) but they are quite involved.

**This app provides a drop-in solution for timed notifications that compile all of your "Recently Added" Tautulli events into one notification.**

<img src="/docs/assets/thumbnail-multiple.png"
alt="thumbnail view" width="400">

# Quick Start

Assuming:

* Host machine IP is 192.168.1.101
  * Tautulli and TND will be installed on the same machine using Docker with bridge mode networking
  * Discord webhook/notification agent already setup in Tautulli
* You want the digest to be posted at 5pm Eastern Standard Time

#### Setup Docker

* Include environmental variables for:
  * Your existing discord webhook from Tautulli discord notification agent using `DISCORD_WEBHOOK`
  * The 5pm cron expression using `CRON`
* Map the default port 8078
* Create a volume to persist data

```shell
docker volume create tnd_data
docker run -e TZ="America/New_York" -e DISCORD_WEBHOOK="https://discord.com/api/webhooks/606873513" -e CRON="0 17 * * *" -p 8078:8078 -v tnd_data:/config -d ghcr.io/foxxmd/tautuilli-notification-digest
```

TND endpoint is now available at `http://192.168.1.101:8078/my-digest`

#### Modify Tautulli

Edit your existing Tautuilli discord notification agent:

* On the **Configuration** tab
  * Change **Discord Webhook URL** to `http://192.168.1.101:8078/my-digest`
  * Make sure these settings are set
    * ✅ Include Rich Metadata Info
    * ✅ Include Summary
    * ✅ Include Link to Plex Web (optional)
    * ❎ Use Poster Thumbnail
* On the **Triggers**
  * ✅ Recently Added

**Save** your changes. TND is now setup and running.

# Install

## Docker

* [Dockerhub](https://hub.docker.com/r/foxxmd/tautulli-notification-digest) - `docker.io/foxxmd/tautulli-notification-digest`
* [GHCR](https://github.com/foxxmd/context-mod/pkgs/container/tautulli-notification-digest) - `ghcr.io/foxxmd/tautulli-notification-digest`

## Local (Node)

```shell
clone https://github.com/FoxxMD/tautulli-notification-digest.git .
cd tautulli-notification-digest
yarn install
```

# Setup

## Tautulli

You must first configure a [Tautulli discord notification agent.](https://github.com/Tautulli/Tautulli/wiki/Notification-Agents-Guide#discord)

In your agent ensure these settings are used:

* Configuration
  * Discord Webhook URL
    * **TND location + Slug (see below)**
  * ✅ Include Rich Metadata Info
  * ✅ Include Summary
  * ✅ Include Link to Plex Web (optional)
  * ❎ Use Poster Thumbnail
* Triggers
  * ✅ Recently Added

If you already have an existing agent you will re-use the Webhook url for TND so save it!

Your **Discord Webhook URL** for Tautuilli will be the **location of the TND server + your configured slug.**

Example:

* TND and Tautulli on the same computer, using ENV setup => `http://localhost:8078/my-digest`
* TND on a different machine (192.168.0.180) than Tautulli, using ENV setup => `http://192.168.0.180:8078/my-digest`
* TND on a different machine (192.168.0.180) than Tautulli, using config setup with slug `test` => `http://192.168.0.180:8078/test`

## Configuration

TND can be run using either [environmental variables](#env) or a [configuration file.](#file) If you want to customize how TND behaves you will need to use a configuration file.

### ENV

If you are fine with all default settings then TND can be configured using only environmental variables.

| Environmental Variable | Required? | Example                                      | Description                                                                                                                                                                                                                                                                                     |
|------------------------|-----------|----------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| DISCORD_WEBHOOK        | Yes       | `https://discord.com/api/webhooks/606873513` | The [discord webhook](https://support.discord.com/hc/en-us/articles/228383668-Intro-to-Webhooks) for a channel you want to post to. This would be the same hook you used when [setting up Tautulli notifications.](https://github.com/Tautulli/Tautulli/wiki/Notification-Agents-Guide#discord) |
| CRON                   | Yes       | `0 17 * * *`                                 | A [cron expression](https://crontab.guru) for when TND should send notifications. The example sends a notification once a day at 5:00pm local time.                                                                                                                                             |
| FORMAT                 | No        |                                              | Always use the specified embed format instead of collapsing for space. Options are: poster, thumbnail, text, list                                                                                                                                                                               |
| PORT                   | No        | 8078                                         | The port the web server will listen for incoming events from Tautulli                                                                                                                                                                                                                           |
| TZ                     | No        | America/New_York                             | [Timezone identifier](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones#List) to use. Defaults to UTC.                                                                                                                                                                               |

#### Docker

Add [environmental variables](https://docs.docker.com/engine/reference/commandline/run/#env) using the `-e flag` and create a persistent volume for TND data:

```shell
docker volume create tnd_data
docker run -e DISCORD_WEBHOOK="https://discord.com/api/webhooks/606873513" -e CRON="0 17 * * *" -p 8078:8078 -v tnd_data:/config -d ghcr.io/foxxmd/tautuilli-notification-digest
```

#### Local

Export your variables before the run command or use a [.env file](https://www.codementor.io/@parthibakumarmurugesan/what-is-env-how-to-set-up-and-run-a-env-file-in-node-1pnyxw9yxj)

```shell
DISCORD_WEBHOOK="https://discord.com/api/webhooks/606873513" -e CRON="0 17 * * *" yarn run start
```

### File

An example config file with all options [can be found here.](/config/config.yaml.example)

#### Docker

[Mount a directory](https://docs.docker.com/storage/bind-mounts/) containing your `config.yaml` file to the `/config` directory in the container:

```shell
docker run -v /host/path/folder:/config -p 8078:8078 -d ghcr.io/foxxmd/tautuilli-notification-digest
```

#### Local

Add your `config.yaml` to a new folder named `data` in the project directory.

# Run

Make sure you have:

* Setup a [Tautuilli discord notification agent](#tautulli)
* Are using **either** [environmental variables](#env) or a [file configuration](#file)

The below run examples will send one summary digest notification a day to discord at 5pm local time.

## Docker

**Note:** When using a `bridge` network (docker default) make sure you map the correct server port (8078 by default) from the container to host.

**Note:** **You must persist data! If** 

* Using only ENVs then [create a volume](#docker-1)
* Using a file (`config.yaml`) then [bind a directory](#docker-2)

```shell
docker run -v tnd_data:/config -e DISCORD_WEBHOOK="https://discord.com/api/webhooks/606873513" -e CRON="0 17 * * *" -p 8078:8078 -d ghcr.io/foxxmd/tautuilli-notification-digest
```

## Local

```shell
DISCORD_WEBHOOK="https://discord.com/api/webhooks/606873513" -e CRON="0 17 * * *" yarn run start
```

# Options

This section will cover major options for the [file configuration](#file) but is not exhaustive. For a more complete example reference the [**example configuration**](/config/config.yaml.example) or [**the entire config schema can be explored here.**](https://json-schema.app/view/%23?url=https%3A%2F%2Fraw.githubusercontent.com%2FFoxxMD%2Ftautulli-notification-digest%2Fmain%2Fsrc%2Fcommon%2Fschema%2Foperator.json) Use the `Example (YAML)` tab to see examples of individual objects.

## Embed Formats

TND can display notifications in several formats with increasing levels of compactness:

### Poster

The default and same way Tautuilli displays notifications.

<img src="/docs/assets/poster-multiple.png"
alt="thumbnail view" width="400">

### Thumbnail

Display post image as a thumbnail

<img src="/docs/assets/thumbnail-multiple.png"
alt="thumbnail view" width="400">

### Text

Does not include any images but still includes linkable title, summary, and other links.

<img src="/docs/assets/text-multiple.png"
alt="thumbnail view" width="400">

### List

Only includes title of the notification (media name)

<img src="/docs/assets/list-multiple.png"
alt="thumbnail view" width="400">

### Embed Format Collapse

You can configure what [format](#embed-formats) TND will render notifications in based on the number of notifications that have been collected since the last time it posted a digest.

These thresholds are configured in the config file like this:

```yaml
digests:
  - cron: '...'
    discord:
      webhook: '...'
      options:
        list: false
        text: false
        thumbnail: 2
        poster: 0
```

TND determines which format to use by checking for format type threshold by increasing compactness:

List -> Text -> Thumbnail -> Poster

Example:

* 10 pending notifications
* `list: 15 | text: 9 | thumbnail: 8 | poster: 1`
* `text` will be chosen because 10 > 9
  * Note: TND will not consider any "larger" format sizes if a smaller format (`text`) condition is true, even if larger formats have higher thresholds

**Note:** Setting a format to `false` disables it from ever being used.

#### Default Collapse Settings

The default thresholds are:

```
list: false
text: false
thumbnail: 2
poster: 0
```

IE

* If any pending notifications exist, `poster` is used
* If 2 or more pending notifications, `thumbnail` is used

#### Overflow

Discord only allows [10 embeds per message](https://discordjs.guide/popular-topics/embeds.html#embed-limits). If your digest would render more than 9 embeds then TND will automatically create an **overflow** embed that renders as a [list](#list).

<img src="/docs/assets/overflow.png"
alt="thumbnail view" width="400">

The number of notifications shown in the overflow list is truncated after `overflowTruncate` number of notifications and a remaining count is shown.

```yaml
digests:
  - cron: '...'
    discord:
      webhook: '...'
      options:
        overflowTruncate: 20 # defaults to 20
```

## Deduplication Behavior

TND can prevent duplicate, or already seen notifications, from being rendered in a digest. This is useful if Tautulli sends identical notifications after an initial notification which can occur for things like:

* New metadata is added (summary or iamges are fetched from plex agent)
* Adding multiple episodes to a season at different time periods
* A newer/better quality version of an existing movie/episode is added (replaced) in Plex

TND detects duplicates by comparing the **title of the message sent by Tautuilli.** EX: `Season 1 of Show x was added to Plex` or `New Movie (2023) was added to Plex`.

Behavior options are:

* `'all'` - Prevent **any** notification that has been processed by TND before from being future digests
* `'session'` (default) - Prevent duplicate notifications within one session IE only unique pending notifications -- if a duplicate is detected it is used instead of the original b/c we assume metadata may have changed
* `'never'` - Always allow duplicates

# API

## Tautuilli Webhook

Any `POST` request to a URL NOT starting with `/api` will be treated as a Tautulli Discord Notification request.

## Run Pending Notifications

Using the **slug** defined for your digest (ENV defaults to `my-digest`) make a `POST` request to

```
http://SERVER_IP:8078/api/SLUG
```

and TND will immediately process any pending notifications.

TIP: Create a bookmarklet for your browser to run this easily:

* Using https://www.yourjs.com/bookmarklet in the Bookmarklet Javascript box:
  * `fetch('http://MY_IP:8078/api/my-digest', {method: 'POST'}).then();`
* Convert to Data URL
  * Drag and drop converted data url into your bookmarks

Then the bookmark can be clicked to trigger pending notifications to run.
