// Original file: src/video/v1/video.proto


export interface GetVideoResponse {
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

export interface GetVideoResponse__Output {
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
