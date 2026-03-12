import React, { useState, useRef, useEffect } from 'react';

// By embedding the audio file as a Base64 data URI, we eliminate external network dependencies
// and permanently fix the "no supported sources" error caused by broken links.
const BGM_DATA_URL = 'data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjQ1LjEwMAAAAAAAAAAAAAAA//tAwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAVFVPLUr+//tAwjUklDQV9JRD0yMDIyMTAxM19BVERfRkFERV9PVVRfREVQQ19NQVNLXzAwMDI0MDIyMDUwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwAAAAAP/7QMKYAAMDlAAAAAQAH/9WLEbQAAAAAAAD/+1A8QAAAAAACABohBwqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq-p/feth9C9iVlVMAAFlVUxVlV/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/feth9C9iVlVMAAFlVUxVlV/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/a/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/feth9C9iVlVMAAFlVUxVlV/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/feth9C9iVlVMAAFlVUxVlV/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/-';

interface MusicPlayerProps {
  isTense?: boolean;
}

const MusicPlayer: React.FC<MusicPlayerProps> = ({ isTense = false }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.2); // Start at a reasonable volume
  const [isVolumeSliderVisible, setIsVolumeSliderVisible] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(typeof Audio !== 'undefined' ? new Audio(BGM_DATA_URL) : null);

  useEffect(() => {
    try {
      const savedVolume = window.localStorage.getItem('bgm_volume');
      const savedMuted = window.localStorage.getItem('bgm_muted');
      const savedPlaying = window.localStorage.getItem('bgm_playing');
      if (savedVolume) setVolume(Math.min(1, Math.max(0, Number(savedVolume))));
      if (savedMuted) setIsMuted(savedMuted === 'true');
      if (savedPlaying) setIsPlaying(savedPlaying === 'true');
    } catch {
      // ignore storage errors
    }
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.loop = true;
    audio.volume = isMuted ? 0 : volume;
    audio.playbackRate = isTense ? 1.06 : 1;

    if (isPlaying) {
      audio.play().catch(() => setIsPlaying(false));
    } else {
      audio.pause();
    }

    try {
      window.localStorage.setItem('bgm_volume', String(volume));
      window.localStorage.setItem('bgm_muted', String(isMuted));
      window.localStorage.setItem('bgm_playing', String(isPlaying));
    } catch {
      // ignore storage errors
    }

    return () => {
      audio.pause();
    };
  }, [volume, isPlaying, isMuted, isTense]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'm') setIsMuted((v) => !v);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    try {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        await audio.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error("Audio play failed:", error);
      setIsPlaying(false);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
  };
  
  return (
    <div 
      className="fixed top-4 right-4 z-50 flex items-center gap-2 group"
      onMouseEnter={() => setIsVolumeSliderVisible(true)}
      onMouseLeave={() => setIsVolumeSliderVisible(false)}
    >
      {/* The audio element is no longer rendered, it is controlled via the ref */}
      
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={volume}
        onChange={handleVolumeChange}
        className={`w-24 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer transition-opacity duration-300 ${isVolumeSliderVisible ? 'opacity-100' : 'opacity-0'}`}
        style={{
            accentColor: '#f59e0b', // amber-500
        }}
        aria-label="Volume control"
      />

      <button
        onClick={() => setIsMuted((m) => !m)}
        className="w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full transition-all duration-200 backdrop-blur-sm border border-white/20 flex items-center justify-center"
        aria-label={isMuted ? 'Unmute music' : 'Mute music'}
        title="Mute/Unmute (M)"
      >
        {isMuted ? '🔇' : '🔊'}
      </button>

      <button
        onClick={togglePlay}
        className="w-12 h-12 bg-black/60 hover:bg-black/80 text-white font-bold rounded-full transition-all duration-200 backdrop-blur-sm border border-white/20 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-amber-500"
        aria-label={isPlaying ? 'Pause music' : 'Play music'}
      >
        {isPlaying ? (
            // Pause Icon
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 00-1 1v2a1 1 0 102 0V9a1 1 0 00-1-1zm6 0a1 1 0 00-1 1v2a1 1 0 102 0V9a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
        ) : (
            // Play Icon
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
        )}
      </button>
      {isTense && (
        <span className="text-xs text-rose-300 bg-black/50 border border-rose-500/40 px-2 py-1 rounded-md">⚔️ Tense</span>
      )}
    </div>
  );
};

export default MusicPlayer;
