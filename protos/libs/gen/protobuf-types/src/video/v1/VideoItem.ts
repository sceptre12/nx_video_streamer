// Original file: src/video/v1/video.proto


export interface VideoItem {
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

export interface VideoItem__Output {
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
