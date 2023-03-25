// Uncomment these if you want to remove firebase and add your own custom backend:
// export { useChatChannels } from './local/useChatChannels'
// export { useChatMessages } from './local/useChatMessages'
// export { useChatSingleChannel } from './local/useChatSingleChannel'

// Uncomment these if you want to use our own custom backend:
// export { useChatChannels } from './backend/useChatChannels'
// export { useChatMessages } from './backend/useChatMessages'
// export { useChatSingleChannel } from './backend/useChatSingleChannel'


export { useChatChannels } from './aws/useChatChannels'
export { useChatMessages } from './aws/useChatMessages'
export { useChatSingleChannel } from './aws/useChatSingleChannel'
