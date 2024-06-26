// Original file: src/video/v1/video.proto


export interface VideoItem {
  'videoId'?: (string);
  'startTime'?: (number);
  'endTime'?: (number);
  'isStreaming'?: (boolean);
  'thumbnailPath'?: (string);
  'videoPath'?: (string);
  '_endTime'?: "endTime";
  '_thumbnailPath'?: "thumbnailPath";
  '_videoPath'?: "videoPath";
}

export interface VideoItem__Output {
  'videoId': (string);
  'startTime': (number);
  'endTime'?: (number);
  'isStreaming': (boolean);
  'thumbnailPath'?: (string);
  'videoPath'?: (string);
  '_endTime': "endTime";
  '_thumbnailPath': "thumbnailPath";
  '_videoPath': "videoPath";
}
