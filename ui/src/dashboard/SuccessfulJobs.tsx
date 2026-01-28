import { FC } from 'react';
import Icon from '@mui/icons-material/ThumbUp';

import CardWithIcon from './CardWithIcon';

interface Props {
    value?: string;
}

const SuccessfulJobs: FC<Props> = ({ value }) => {
    return (
        <CardWithIcon
            to='/jobs?filter={"status":"success"}'
            icon={Icon}
            title='Successful Jobs'
            subtitle={value}
            color="#38a169"
        />
    );
};

export default SuccessfulJobs;
