import React, { useEffect, useState, useContext } from 'react'
import axios from 'axios'
import { Navigate } from 'react-router-dom'
import { Context } from '../main'

const Messages = () => {
  const [messages, setMessages] = useState([])
  const { isAuthenticated } = useContext(Context)

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const { data } = await axios.get('http://localhost:4000/api/v1/message/getall', {
          withCredentials: true,
        })
        setMessages(data.messages || [])
      } catch (error) {
        console.log('Error fetching messages:', error)
      }
    }
    fetchMessages()
  }, [])

  if (!isAuthenticated) {
    return <Navigate to='/login' />
  }

  return (
    <section className='page page-messages'>
      <h1>Messages</h1>
      <div className='banner'>
        {messages && messages.length > 0 ? (
          messages.map((element, index) => (
            <div className='card' key={element._id || index}>
              <div className='details'>
                <p>First Name: <span>{element.firstName}</span></p>
                <p>Last Name: <span>{element.lastName}</span></p>
                <p>Email: <span>{element.email}</span></p>
                <p>Phone: <span>{element.phone}</span></p>
                <p>Message: <span>{element.message}</span></p>
              </div>
            </div>
          ))
        ) : (
          <p className='empty-state'>No messages found.</p>
        )}
      </div>
    </section>
  )
}

export default Messages