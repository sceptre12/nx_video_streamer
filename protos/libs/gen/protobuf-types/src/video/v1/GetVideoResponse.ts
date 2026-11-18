// Original file: src/video/v1/video.proto


export interface GetVideoResponse {
  'videoId'?: (string);
  'startTime'?: (number);
  'endTime'?: (number);
  'isStreaming'?: (boolean);
  'thumbnailPath'?: (string);
  'videoPath'?: (string);
  'ownerId'?: (string);
  'title'?: (string);
  'durationS'?: (number);
  '_endTime'?: "endTime";
  '_thumbnailPath'?: "thumbnailPath";
  '_videoPath'?: "videoPath";
  '_ownerId'?: "ownerId";
  '_title'?: "title";
  '_durationS'?: "durationS";
}

export interface GetVideoResponse__Output {
  'videoId': (string);
  'startTime': (number);
  'endTime'?: (number);
  'isStreaming': (boolean);
  'thumbnailPath'?: (string);
  'videoPath'?: (string);
  'ownerId'?: (string);
  'title'?: (string);
  'durationS'?: (number);
  '_endTime': "endTime";
  '_thumbnailPath': "thumbnailPath";
  '_videoPath': "videoPath";
  '_ownerId': "ownerId";
  '_title': "title";
  '_durationS': "durationS";
}
