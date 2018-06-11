const Resource = require('./resource')
const util = require('util')
const _ = require('lodash')
const crypto = require('crypto')
const pruned = require('./json-pruned')
const fs = require('fs')
const request = require('request-promise')
const Promise = require('bluebird')


function Media(session, params) {
  Resource.apply(this, arguments)
}

util.inherits(Media, Resource)

module.exports = Media
const Request = require('./request')
const Comment = require('./comment')
const Account = require('./account')
const Location = require('./location')
const Exceptions = require('./exceptions')
const camelKeys = require('camelcase-keys')


Media.prototype.parseParams = function parseParams(json) {
  const that = this

  // previewComments
  this.previewComments = _.map(json.preview_comments, comment => new Comment(this.getSession(), comment))

  // location
  if (_.isObject(json.location)) {
    const location = json.location
    location.location = Object.create(json.location)
    location.title = location.name
    location.subtitle = null
    this.location = new Location(this.getSession(), location)
  }

  // owner igAccount
  this.account = new Account(this.getSession(), json.user)

  // likers  & toplikers
  this.likers = (json.likers || []).map(l => new Account(this.getSession(), l))
  this.topLikers = (json.top_likers || []).map(l => new Account(that.session, l))

  // start build object data
  const hash = camelKeys(json)

  // remove owner
  delete hash.user

  // mediaType = 1 => imagen
  // mediaType  = 2 => video
  // mediaType  = 8 => carouselMedia

  // video type
  if (json.media_type === 2) {
    hash.video = {
      versions: json.video_versions,
      hasAudio: json.has_audio,
      duration: json.video_duration,
    }
  }

  // carousel type
  hash.carouselMedia = []
  if (json.media_type === 8 && _.isArray(json.carousel_media)) {
    hash.carouselMedia = _.map(json.carousel_media, medium => new Media(this.getSession(), medium))
  }

  // caption
  if (_.isObject(json.caption)) { hash.caption = json.caption.text }

  // data
  hash.takenAt = parseInt(json.taken_at, 10) * 1000

  // image alternates versions
  if (_.isObject(json.image_versions2)) {
    hash.images = json.image_versions2.candidates
  } else if (_.isObject(json.carousel_media)) {
    hash.images = json.carousel_media.map(media => media.image_versions2.candidates)
  }

  // return object
  let data = {
    igId: String(hash.id),
    takenAt: hash.takenAt,
    likeCount: hash.likeCount,
    hasLiked: hash.hasLiked,
    mediaType: hash.mediaType,
    commentLikesEnabled: hash.commentLikesEnabled,
    viewCount: hash.viewCount,
    deviceTimestamp: hash.deviceTimestamp,
    code: hash.code,
    clientCacheKey: hash.clientCacheKey,
    filterType: hash.filterType,
    images: hash.images,
    originalWidth: hash.originalWidth,
    originalHeight: hash.originalHeight,
    canViewerReshare: hash.canViewerReshare,
    caption: hash.caption,
    captionIsEdited: hash.captionIsEdited,
    commentThreadingEnabled: hash.commentThreadingEnabled,
    hasMoreComments: hash.hasMoreComments,
    maxNumVisiblePreviewComments: hash.maxNumVisiblePreviewComments,
    previewComments: hash.previewComments,
    commentCount: hash.commentCount,
    photoOfYou: hash.photoOfYou,
    canViewerSave: hash.canViewerSave,
    organicTrackingToken: hash.organicTrackingToken,
    carouselMedia: hash.carouselMedia,
    videoVersions: hash.videoVersions,
  }

  // clean all undefined
  data = _.pickBy(data, value => value !== undefined)

  return data
}


Media.prototype.getParams = function getParams() {
  return _.extend(this.params, {
    igAccount: this.account.getParams(),
    // TODO
    // previewComments: _.map(this.previewComments, 'params'),
    likers: _.map(this.likers, a => a.getParams()),
    topLikers: _.map(this.topLikers, a => a.getParams()),
    location: this.location ? this.location.getParams() : {},
  })
}

/*
Media.getById = function (session, id) {
  return new Request(session)
    .setMethod('GET')
    .setResource('mediaInfo', { mediaId: id })
    .send()
    .then(json => new Media(session, json.items[0]))
}

Media.getByUrl = function (session, url) {
  const self = this
  return request({
    url: 'https://api.instagram.com/oembed/',
    qs: { url },
    json: true,
  })
    .then(response => self.getById(session, response.media_id))
    .catch((reason) => {
      if (reason.error === 'No URL Match') throw new Exceptions.NotFoundError('No URL Match')
      else throw reason
    })
}

Media.likers = function (session, mediaId) {
  return new Request(session)
    .setMethod('GET')
    .setResource('mediaLikes', { mediaId })
    .send()
    .then(data => _.map(data.users, user => new Account(session, user)))
}


Media.delete = function (session, mediaId) {
  return new Request(session)
    .setMethod('POST')
    .setResource('mediaDeletePhoto', { mediaId })
    .setData({
      media_id: mediaId,
    })
    .generateUUID()
    .signPayload()
    .send()
    .then((json) => {
      if (json.did_delete) return
      throw new Exceptions.RequestError({
        messaage: 'Not posible to delete medium!',
      })
    })
}

Media.edit = function (session, mediaId, caption, userTags) {
  const requestPayload = {
    media_id: mediaId,
    caption_text: caption,
  }

  if (userTags) {
    requestPayload.usertags = JSON.stringify(userTags)
  }

  return new Request(session)
    .setMethod('POST')
    .setResource('mediaEdit', { mediaId })
    .setData(requestPayload)
    .generateUUID()
    .signPayload()
    .send()
    .then((json) => {
      if (json.media.caption_is_edited) {
        return new Media(session, json.media)
      }
      throw new Exceptions.RequestError({
        messaage: 'Edit media not successful!',
      })
    })
}

Media.configurePhoto = function (session, uploadId, caption, width, height, userTags) {
  if (_.isEmpty(uploadId)) { throw new Error('Upload argument must be upload valid upload id') }
  if (!caption) caption = ''
  if (!width) width = 800
  if (!height) height = 800
  if (!userTags) userTags = {}

  const CROP = 1
  return session.getAccountId()
    .then((accountId) => {
      let payload = pruned({
        source_type: '4',
        caption,
        upload_id: uploadId,
        usertags: JSON.stringify(userTags),
        _uid: accountId.toString(),
        device: session.device.payload,
        edits: {
          crop_original_size: ['$width', '$height'],
          crop_center: ['$zero', '$negativeZero'],
          crop_zoom: '$crop',
        },
        extra: {
          source_width: width,
          source_height: height,
        },
      })
      payload = payload.replace(/\"\$width\"/gi, width.toFixed(1))
      payload = payload.replace(/\"\$height\"/gi, height.toFixed(1))
      payload = payload.replace(/\"\$zero\"/gi, (0).toFixed(1))
      payload = payload.replace(/\"\$negativeZero\"/gi, `-${(0).toFixed(1)}`)
      payload = payload.replace(/\"\$crop\"/gi, CROP.toFixed(1))

      return new Request(session)
        .setMethod('POST')
        .setResource('mediaConfigure')
        .setBodyType('form')
        .setData(JSON.parse(payload))
        .generateUUID()
        .signPayload()
        .send()
    })
    .then(json => new Media(session, json.media))
}

Media.configurePhotoStory = function (session, uploadId, width, height) {
  if (_.isEmpty(uploadId)) { throw new Error('Upload argument must be upload valid upload id') }
  if (!width) width = 800
  if (!height) height = 800
  const CROP = 1
  return session.getAccountId()
    .then((accountId) => {
      let payload = pruned({
        source_type: '4',
        upload_id: uploadId,
        _uid: accountId.toString(),
        device: session.device.payload,
        edits: {
          crop_original_size: ['$width', '$height'],
          crop_center: ['$zero', '$negativeZero'],
          crop_zoom: '$crop',
        },
        extra: {
          source_width: width,
          source_height: height,
        },
      })
      payload = payload.replace(/\"\$width\"/gi, width.toFixed(1))
      payload = payload.replace(/\"\$height\"/gi, height.toFixed(1))
      payload = payload.replace(/\"\$zero\"/gi, (0).toFixed(1))
      payload = payload.replace(/\"\$negativeZero\"/gi, `-${(0).toFixed(1)}`)
      payload = payload.replace(/\"\$crop\"/gi, CROP.toFixed(1))

      return new Request(session)
        .setMethod('POST')
        .setResource('mediaConfigureStory')
        .setBodyType('form')
        .setData(JSON.parse(payload))
        .generateUUID()
        .signPayload()
        .send()
    })
    .then(json => new Media(session, json.media))
}

Media.configureVideo = function (session, uploadId, caption, durationms, delay, {
  audio_muted = false,
  trim_type = 0,
  source_type = 'camera',
  mas_opt_in = 'NOT_PROMPTED',
  disable_comments = false,
  filter_type = 0,
  poster_frame_index = 0,
  geotag_enabled = false,
  camera_position = 'unknown',
} = {}) {
  if (_.isEmpty(uploadId)) { throw new Error('Upload argument must be upload valid upload id') }
  if (typeof (durationms) === 'undefined') { throw new Error('Durationms argument must be upload valid video duration') }
  const duration = durationms / 1000
  if (!caption) caption = ''
  if (!delay || typeof delay !== 'number') delay = 6500
  return Promise.delay(delay)
    .then(() => session.getAccountId())
    .then((accountId) => {
      const payload = pruned({
        video_result: 'deprecated',
        audio_muted,
        trim_type,
        client_timestamp: String(new Date().getTime()).substr(0, 10),
        caption,
        edits: {
          filter_strength: 1,
        },
        clips: [
          {
            length: duration,
            cinema: 'unsupported',
            original_length: duration,
            source_type,
            start_time: 0,
            trim_type,
            camera_position: 'back',
          },
        ],
        _uid: accountId.toString(),
        source_type,
        mas_opt_in,
        length: duration,
        disable_comments,
        filter_type,
        poster_frame_index,
        geotag_enabled,
        camera_position,
        upload_id: uploadId.toString(),
      })

      return new Request(session)
        .setMethod('POST')
        .setResource('videoConfigure')
        .setBodyType('form')
        .setData(JSON.parse(payload))
        .generateUUID()
        .signPayload()
        .send()
        .then(json => new Media(session, json.media))
        .catch(Exceptions.TranscodeTimeoutError, error =>
          // Well, we just want to repeat our request. Dunno why this is happening and we should not let our users deal with this crap themselves.
          Media.configureVideo(session, uploadId, caption, durationms, delay))
    })
}

Media.configurePhotoAlbum = function (session, uploadId, caption, width, height, userTags) {
  if (_.isEmpty(uploadId)) { throw new Error('Upload argument must be upload valid upload id') }
  if (!caption) caption = ''
  if (!width) width = 800
  if (!height) height = 800
  if (!userTags) userTags = {}

  const CROP = 1

  const payload = {
    source_type: '4',
    caption,
    upload_id: uploadId,
    media_folder: 'Instagram',
    device: session.device.payload,
    edits: {
      crop_original_size: [width.toFixed(1), height.toFixed(1)],
      crop_center: [(0).toFixed(1), `-${(0).toFixed(1)}`],
      crop_zoom: CROP.toFixed(1),
    },
    extra: {
      source_width: width,
      source_height: height,
    },
  }
  return Promise.resolve(payload)
}

Media.configureVideoAlbum = function (session, uploadId, caption, durationms, delay, width, height) {
  if (_.isEmpty(uploadId)) { throw new Error('Upload argument must be upload valid upload id') }
  if (typeof (durationms) === 'undefined') { throw new Error('Durationms argument must be upload valid video duration') }
  const duration = durationms / 1000
  if (!caption) caption = ''
  if (!delay || typeof delay !== 'number') delay = 6500
  return Promise.delay(delay)
    .then(() => {
      const payload = {
        filter_type: '0',
        source_type: '3',
        video_result: 'deprecated',
        caption,
        upload_id: uploadId,
        device: session.device.payload,
        length: duration,
        clips: [
          {
            length: duration,
            source_type: '3',
            camera_position: 'back',
          },
        ],
        audio_muted: false,
        poster_frame_index: 0,
        extra: {
          source_width: width,
          source_height: height,
        },
      }

      return Promise.resolve(payload)
    })
}

Media.configureAlbum = function (session, medias, caption, disableComments) {
  const albumUploadId = new Date().getTime()

  caption = caption || ''
  disableComments = disableComments || false

  Promise.mapSeries(medias, (media) => {
    if (media.type === 'photo') {
      return Media.configurePhotoAlbum(session, media.uploadId, caption, media.size[0], media.size[1], media.usertags)
    } else if (media.type === 'video') {
      return Media.configureVideoAlbum(session, media.uploadId, caption, media.durationms, media.delay, media.size[0], media.size[1])
    }
    throw new Error(`Invalid media type: ${media.type}`)
  })
    .then((results) => {
      const params = {
        caption,
        client_sidecar_id: albumUploadId,
        children_metadata: results,
      }

      if (disableComments) {
        params.disable_comments = '1'
      }

      return new Request(session)
        .setMethod('POST')
        .setResource('mediaConfigureSidecar')
        .setBodyType('form')
        .setData(params)
        .generateUUID()
        .signPayload()
        .send()
    })
}
*/
