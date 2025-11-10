import React from 'react'

const SideBar = () => {
    const [show, setShow] = useState(false);
    const { isAuthenticated, user } = useContext(Context)

  return (
    <div>SideBar</div>
  )
}

export default SideBar