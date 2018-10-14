import * as Consts from '../configs/constants';

export function isImage( fileExtension = '' ) {
	return Consts.IMAGE_TYPES.indexOf(fileExtension.toLowerCase()) >- 1;
}

export function getFileType( fileExtension ) {
	return isImage(fileExtension) ? Consts.IMAGE : Consts.OTHER ;
}