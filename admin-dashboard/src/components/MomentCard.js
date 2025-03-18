import React from 'react';

const MomentCard = ({ moment, onSelectMoment }) => {
  return (
    <div onClick={() => onSelectMoment(moment.moment_id)}>
      <img src={moment.imageURL} alt={moment.moment_id} />
      <p>{moment.creator_details.user_name}</p>
      <p>{moment.upload_time}</p>
      <p>Status: {moment.status}</p>
    </div>
  );
};

export default MomentCard;
