import { useState } from 'react';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

/**
 * I'm keeping the ui really basic
 * Show a list of videos within the db_server storage
 * Clicking on a video starts the process to stream
 * The video to the main view
 * @returns
 */
export function App() {
  const [selectedVideo, setSelectedVideo] = useState(null);

  return (
    <Container fluid>
      <Row>
        <Col xs={3}>1 of 1</Col>
        <Col>1 of 1</Col>
      </Row>
    </Container>
  );
}

export default App;
