import { Routes, Route } from 'react-router-dom'
import CreateNotePage from './pages/CreateNotePage'
import ViewNotePage from './pages/ViewNotePage'
import ManageNotePage from './pages/ManageNotePage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<CreateNotePage />} />
      <Route path="/note/:noteId" element={<ViewNotePage />} />
      <Route path="/manage/:noteId/:token" element={<ManageNotePage />} />
    </Routes>
  )
}

export default App
