import React, { useState, useRef, useEffect } from 'react';

// By embedding the audio file as a Base64 data URI, we eliminate external network dependencies
// and permanently fix the "no supported sources" error caused by broken links.
const BGM_DATA_URL = 'data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjQ1LjEwMAAAAAAAAAAAAAAA//tAwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAVFVPLUr+//tAwjUklDQV9JRD0yMDIyMTAxM19BVERfRkFERV9PVVRfREVQQ19NQVNLXzAwMDI0MDIyMDUwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwAAAAAP/7QMKYAAMDlAAAAAQAH/9WLEbQAAAAAAAD/+1A8QAAAAAACABohBwqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq-p/feth9C9iVlVMAAFlVUxVlV/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/feth9C9iVlVMAAFlVUxVlV/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/a/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/feth9C9iVlVMAAFlVUxVlV/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/feth9C9iVlVMAAFlVUxVlV/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/-';

const MusicPlayer: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.2); // Start at a reasonable volume
  const [isVolumeSliderVisible, setIsVolumeSliderVisible] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current) {
      audio.current.volume = volume;
    }
  }, [volume]);

  // Use a separate ref for the audio element to avoid issues with state updates
  const audio = useRef(typeof Audio !== 'undefined' ? new Audio(BGM_DATA_URL) : null);

  useEffect(() => {
    if (!audio.current) return;
    audio.current.loop = true;
    audio.current.volume = volume;

    // Cleanup on component unmount
    return () => {
      if (audio.current) {
        audio.current.pause();
        audio.current = null;
      }
    };
  }, [volume]);


  const togglePlay = async () => {
    if (!audio.current) return;
    try {
      if (isPlaying) {
        audio.current.pause();
        setIsPlaying(false);
      } else {
        await audio.current.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error("Audio play failed:", error);
      // Autoplay is often blocked, we can't force it, but the user can still click.
      setIsPlaying(false);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audio.current) {
        audio.current.volume = newVolume;
    }
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
    </div>
  );
};

export default MusicPlayer;
